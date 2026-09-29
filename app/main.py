import base64
import logging
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from collections import Counter
from pathlib import Path
from urllib.parse import quote, urlparse
from uuid import uuid4
from typing import Any, Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from pymongo import ReturnDocument

from app.whatsapp import WhatsAppNotifier, build_order_text, to_whatsapp_number


class Settings(BaseSettings):
    mongodb_uri: str = ""
    mongodb_database: str = "coolman"
    frontend_origin: str = "http://localhost:8080"
    # WhatsApp Cloud API: new orders are pushed to the owner's WhatsApp when a token and sender number ID are set.
    whatsapp_token: str = ""
    whatsapp_phone_number_id: str = ""
    # Owner's number; falls back to the phone saved in admin Settings.
    whatsapp_owner_number: str = "917200250454"
    # Approved template (image header + one body variable) so alerts arrive even outside the 24-hour chat window.
    whatsapp_template: str = ""
    whatsapp_template_language: str = "en"
    # Public address of this backend, used to build the order photo links WhatsApp downloads.
    # Render sets RENDER_EXTERNAL_URL automatically, so this only needs setting elsewhere (e.g. an ngrok URL locally).
    public_base_url: str = ""
    render_external_url: str = ""
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / ".env", extra="ignore")


settings = Settings()
whatsapp = WhatsAppNotifier(
    settings.whatsapp_token,
    settings.whatsapp_phone_number_id,
    settings.whatsapp_template,
    settings.whatsapp_template_language,
)


def is_placeholder_mongodb_uri(uri: str) -> bool:
    normalized = uri.strip().lower()
    return (
        not normalized
        or "your_user" in normalized
        or "your_password" in normalized
        or "your_cluster" in normalized
        or "your_app" in normalized
    )


client: MongoClient | None = None
products_collection: Collection[dict[str, Any]] | None = None
orders_collection: Collection[dict[str, Any]] | None = None
customers_collection: Collection[dict[str, Any]] | None = None
coupons_collection: Collection[dict[str, Any]] | None = None
settings_collection: Collection[dict[str, Any]] | None = None
order_images_collection: Collection[dict[str, Any]] | None = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    price: float
    originalPrice: float | None = None
    image: str = ""
    rating: float = 0
    reviews: int = 0
    sizes: list[str] = Field(default_factory=list)
    fabric: str
    category: str
    badge: str | None = None
    inStock: bool = True
    stock: int = 0
    active: bool = True
    description: str = ""
    discountPrice: float | None = None
    colors: list[str] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    originalPrice: float | None = None
    image: str | None = None
    sizes: list[str] | None = None
    fabric: str | None = None
    category: str | None = None
    badge: str | None = None
    inStock: bool | None = None
    stock: int | None = None
    active: bool | None = None
    description: str | None = None
    discountPrice: float | None = None
    colors: list[str] | None = None


class OrderItem(BaseModel):
    productId: str
    name: str
    size: str
    quantity: int = Field(gt=0)
    price: float = Field(ge=0)
    # Product photo (JPEG data URL, or a public URL) for the owner's WhatsApp alert; not stored on the order.
    image: str | None = None
    # Custom tees: link to the customer's original uploaded picture (from /api/design-uploads), kept on the order.
    artworkUrl: str | None = Field(default=None, max_length=500)


class DesignUpload(BaseModel):
    # JPEG or PNG data URL; ~10 MB of image once decoded.
    image: str = Field(max_length=14_000_000)


class OrderCreate(BaseModel):
    customerName: str = Field(min_length=1)
    customerEmail: str = Field(min_length=3)
    phone: str = Field(min_length=5)
    address: str = Field(min_length=5)
    items: list[OrderItem] = Field(min_length=1)
    subtotal: float = Field(ge=0)
    deliveryFee: float = Field(ge=0)
    discount: float = Field(ge=0)
    total: float = Field(ge=0)
    couponCode: str | None = None


class OrderUpdate(BaseModel):
    status: str | None = None
    trackingId: str | None = None


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str = Field(min_length=5)


class CouponCreate(BaseModel):
    code: str = Field(min_length=2)
    discountType: str
    discountValue: float = Field(gt=0)
    expiryDate: str
    usageLimit: int = Field(gt=0)
    active: bool = True


class CouponUpdate(BaseModel):
    active: bool | None = None


class CustomerStatusUpdate(BaseModel):
    status: Literal["active", "blocked"]


class StoreSettings(BaseModel):
    storeName: str
    supportEmail: str
    phone: str


def require_collection() -> Collection[dict[str, Any]]:
    if products_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not configured. Copy backend/.env.example to backend/.env and set MONGODB_URI.",
        )
    return products_collection


def require_orders_collection() -> Collection[dict[str, Any]]:
    if orders_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not configured. Start the backend with a valid Atlas connection.",
        )
    return orders_collection


def require_resource_collection(collection: Collection[dict[str, Any]] | None, name: str) -> Collection[dict[str, Any]]:
    if collection is None:
        raise HTTPException(status_code=503, detail=f"MongoDB is not configured for {name}.")
    return collection


def serialize_product(document: dict[str, Any]) -> dict[str, Any]:
    document.pop("_id", None)
    return document


@asynccontextmanager
async def lifespan(_: FastAPI):
    global client, products_collection, orders_collection, customers_collection, coupons_collection, settings_collection, order_images_collection

    mongo_client: MongoClient | None = None
    if settings.mongodb_uri and not is_placeholder_mongodb_uri(settings.mongodb_uri):
        mongo_client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        try:
            mongo_client.admin.command("ping")
            database = mongo_client[settings.mongodb_database]
            products_collection = database.products
            orders_collection = database.orders
            customers_collection = database.customers
            coupons_collection = database.coupons
            settings_collection = database.settings
            order_images_collection = database.order_images
            order_images_collection.create_index([("id", ASCENDING)], unique=True)
            products_collection.create_index([("id", ASCENDING)], unique=True)
            # Repair products an older order bug marked sold out while they still had stock.
            products_collection.update_many({"stock": {"$gt": 0}, "inStock": False}, {"$set": {"inStock": True}})
            products_collection.update_many({"stock": {"$lte": 0}, "inStock": True}, {"$set": {"inStock": False}})
            orders_collection.create_index([("orderId", ASCENDING)], unique=True)
            customers_collection.create_index([("email", ASCENDING)], unique=True)
            coupons_collection.create_index([("code", ASCENDING)], unique=True)
            client = mongo_client
        except PyMongoError as error:
            if mongo_client is not None:
                mongo_client.close()
            client = None
            products_collection = None
            orders_collection = None
            customers_collection = None
            coupons_collection = None
            settings_collection = None
            order_images_collection = None
            raise RuntimeError(f"Unable to connect to MongoDB Atlas: {error}") from error
    else:
        client = None
        products_collection = None
        orders_collection = None
        customers_collection = None
        coupons_collection = None
        settings_collection = None
        order_images_collection = None

    yield
    if client is not None:
        client.close()


app = FastAPI(title="Coolman Style Forge API", version="1.0.0", lifespan=lifespan)
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://cool-man-fe1.onrender.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "database": "connected" if products_collection is not None else "not configured"}


@app.get("/api/products", response_model=list[Product])
def list_products() -> list[dict[str, Any]]:
    collection = require_collection()
    return [serialize_product(item) for item in collection.find({"active": True}, {"_id": 0})]


@app.get("/api/admin/products", response_model=list[Product])
def list_admin_products() -> list[dict[str, Any]]:
    collection = require_collection()
    return [serialize_product(item) for item in collection.find({}, {"_id": 0})]


@app.post("/api/admin/products", response_model=Product, status_code=status.HTTP_201_CREATED)
def create_product(product: Product) -> dict[str, Any]:
    collection = require_collection()
    document = product.model_dump()
    document["inStock"] = document["stock"] > 0
    document["updatedAt"] = datetime.now(timezone.utc)
    try:
        collection.insert_one(document)
    except PyMongoError as error:
        raise HTTPException(status_code=409, detail=f"Could not create product: {error}") from error
    return serialize_product(document)


@app.patch("/api/admin/products/{product_id}", response_model=Product)
def update_product(product_id: str, update: ProductUpdate) -> dict[str, Any]:
    collection = require_collection()
    changes = {key: value for key, value in update.model_dump().items() if value is not None}
    if not changes:
        raise HTTPException(status_code=400, detail="No product changes supplied")
    # Stock is the source of truth for availability.
    if "stock" in changes:
        changes["inStock"] = changes["stock"] > 0
    changes["updatedAt"] = datetime.now(timezone.utc)
    result = collection.find_one_and_update(
        {"id": product_id},
        {"$set": changes},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(result)


@app.delete("/api/admin/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str) -> None:
    collection = require_collection()
    result = collection.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")


CUSTOM_PRODUCT_PREFIX = "custom-"
# WhatsApp image messages accept only JPEG and PNG.
DATA_IMAGE_PATTERN = re.compile(r"data:image/(jpeg|jpg|png);base64,(.+)", re.DOTALL)
MAX_DESIGN_UPLOAD_BYTES = 10 * 1024 * 1024
ORDER_IMAGE_PATH = "/api/order-images/"


@app.post("/api/design-uploads", status_code=status.HTTP_201_CREATED)
def upload_design(upload: DesignUpload, request: Request) -> dict[str, str]:
    """Stores a customer's picture for a custom tee at full quality and returns a public link to it for the owner."""
    collection = require_resource_collection(order_images_collection, "order images")
    match = DATA_IMAGE_PATTERN.match(upload.image)
    if not match:
        raise HTTPException(status_code=422, detail="Upload a JPEG or PNG image.")
    try:
        data = base64.b64decode(match.group(2), validate=True)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="The image could not be read.") from error
    if len(data) > MAX_DESIGN_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large (max 10 MB).")
    image_id = uuid4().hex
    try:
        collection.insert_one(
            {"id": image_id, "kind": "design", "orderId": None, "mime": "image/png" if match.group(1) == "png" else "image/jpeg", "data": data, "createdAt": datetime.now(timezone.utc)}
        )
    except PyMongoError as error:
        raise HTTPException(status_code=503, detail="Could not save the image. Please try again.") from error
    base = public_base_url() or str(request.base_url).rstrip("/")
    return {"url": f"{base}{ORDER_IMAGE_PATH}{image_id}"}


def design_upload_id(url: str | None) -> str | None:
    """The stored image id behind a link returned by /api/design-uploads, or None for anything else."""
    if not url or ORDER_IMAGE_PATH not in url:
        return None
    image_id = url.rsplit("/", 1)[-1]
    return image_id if re.fullmatch(r"[0-9a-f]{32}", image_id) else None


@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, background_tasks: BackgroundTasks) -> dict[str, Any]:
    collection = require_orders_collection()
    products = require_collection()
    customers = require_resource_collection(customers_collection, "customers")
    if customers.find_one({"email": order.customerEmail.lower(), "status": "blocked"}, {"_id": 1}):
        raise HTTPException(status_code=403, detail="This account can't place orders. Please contact support.")
    # Made-to-order custom tees are not catalogue products, so they have no stock to reserve.
    stocked_items = [item for item in order.items if not item.productId.startswith(CUSTOM_PRODUCT_PREFIX)]
    requested_stock = Counter(item.productId for item in stocked_items)
    for item in stocked_items:
        requested_stock[item.productId] += item.quantity - 1

    adjusted_products: list[tuple[str, int]] = []
    for product_id, quantity in requested_stock.items():
        result = products.find_one_and_update(
            {"id": product_id, "active": True, "stock": {"$gte": quantity}},
            {"$inc": {"stock": -quantity}},
            projection={"_id": 0, "stock": 1},
            return_document=ReturnDocument.AFTER,
        )
        if result is None:
            for adjusted_id, adjusted_quantity in adjusted_products:
                products.update_one({"id": adjusted_id}, {"$inc": {"stock": adjusted_quantity}})
            raise HTTPException(status_code=409, detail=f"Not enough stock available for product {product_id}.")
        products.update_one({"id": product_id}, {"$set": {"inStock": result.get("stock", 0) > 0}})
        adjusted_products.append((product_id, quantity))

    def restore_stock() -> None:
        for adjusted_id, adjusted_quantity in adjusted_products:
            products.update_one({"id": adjusted_id}, {"$inc": {"stock": adjusted_quantity}})

    coupon_code = order.couponCode.strip().upper() if order.couponCode else None
    if coupon_code:
        claimed = require_resource_collection(coupons_collection, "coupons").find_one_and_update(
            {**available_coupon_filter(), "code": coupon_code},
            {"$inc": {"usedCount": 1}},
            projection={"_id": 1},
        )
        if claimed is None:
            restore_stock()
            raise HTTPException(status_code=409, detail=f"Coupon {coupon_code} is no longer valid. Remove it and try again.")

    document = order.model_dump()
    document["couponCode"] = coupon_code
    # Checkout sends each photo inline for the WhatsApp alert only; keep it out of the stored order.
    checkout_images = [item.pop("image", None) for item in document["items"]]
    document.update(
        {
            "orderId": f"CM-{datetime.now(timezone.utc):%Y%m%d%H%M%S}",
            "trackingId": f"TRK-{uuid4().hex[:10].upper()}",
            "status": "placed",
            "paymentStatus": "pending",
            "createdAt": datetime.now(timezone.utc),
        }
    )
    try:
        collection.insert_one(document)
        customers.update_one(
            {"email": order.customerEmail.lower()},
            {"$set": {"name": order.customerName, "phone": order.phone, "updatedAt": document["createdAt"]}, "$setOnInsert": {"email": order.customerEmail.lower(), "createdAt": document["createdAt"]}},
            upsert=True,
        )
    except PyMongoError as error:
        restore_stock()
        if coupon_code:
            coupons_collection.update_one({"code": coupon_code}, {"$inc": {"usedCount": -1}})
        raise HTTPException(status_code=409, detail=f"Could not create order: {error}") from error
    document.pop("_id", None)
    # Tie the customer's uploaded pictures to this order so they can be told apart from abandoned uploads.
    artwork_ids = [image_id for image_id in (design_upload_id(item.get("artworkUrl")) for item in document["items"]) if image_id]
    if artwork_ids and order_images_collection is not None:
        try:
            order_images_collection.update_many({"id": {"$in": artwork_ids}, "kind": "design"}, {"$set": {"orderId": document["orderId"]}})
        except PyMongoError:
            logging.getLogger(__name__).warning("Order %s: could not link uploaded pictures.", document["orderId"])
    image_links = order_image_links(document, order_item_images(document, checkout_images))
    background_tasks.add_task(notify_owner_of_order, dict(document), image_links)
    # Click-to-chat link: the customer sends the order (with photo links) to the owner's WhatsApp in one tap.
    owner_number = to_whatsapp_number(owner_whatsapp_phone())
    if owner_number:
        document["whatsappUrl"] = f"https://wa.me/{owner_number}?text={quote(build_order_text(document, image_links))}"
    return document


def owner_whatsapp_phone() -> str | None:
    owner_phone = settings.whatsapp_owner_number
    if not owner_phone and settings_collection is not None:
        owner_phone = (settings_collection.find_one({"key": "store"}, {"_id": 0, "phone": 1}) or {}).get("phone")
    return owner_phone


def notify_owner_of_order(order: dict[str, Any], image_links: list[str | None]) -> None:
    """Automatic alert through the WhatsApp Cloud API; a no-op until WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID are set."""
    whatsapp.notify_new_order(order, owner_whatsapp_phone(), image_links)


def public_base_url() -> str:
    return (settings.public_base_url or settings.render_external_url).rstrip("/")


def is_public_url(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return url.startswith(("http://", "https://")) and host not in {"localhost", "127.0.0.1", "0.0.0.0"} and not host.endswith(".local")


def order_image_links(order: dict[str, Any], candidates: list[list[str]]) -> list[str | None]:
    """One public JPEG/PNG link per item for WhatsApp to download.

    Inline photos (data URLs) are saved and served from /api/order-images/{id}; public URLs are used as they are.
    """
    base = public_base_url()
    links: list[str | None] = []
    for sources in candidates:
        link = None
        for source in sources:
            match = DATA_IMAGE_PATTERN.match(source)
            if match and base and order_images_collection is not None:
                image_id = uuid4().hex
                try:
                    order_images_collection.insert_one(
                        {"id": image_id, "orderId": order["orderId"], "mime": "image/png" if match.group(1) == "png" else "image/jpeg", "data": base64.b64decode(match.group(2)), "createdAt": order["createdAt"]}
                    )
                except (PyMongoError, ValueError):
                    continue
                link = f"{base}/api/order-images/{image_id}"
                break
            if is_public_url(source):
                link = source
                break
        links.append(link)
    if not base and not all(links):
        logging.getLogger(__name__).warning("Order %s: set PUBLIC_BASE_URL so WhatsApp can load uploaded product photos.", order["orderId"])
    return links


@app.get("/api/order-images/{image_id}")
def get_order_image(image_id: str) -> Response:
    """Public so WhatsApp can fetch it; ids are random 128-bit tokens."""
    image = require_resource_collection(order_images_collection, "order images").find_one({"id": image_id}, {"_id": 0, "mime": 1, "data": 1})
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=bytes(image["data"]), media_type=image["mime"], headers={"Cache-Control": "public, max-age=86400"})


@app.post("/api/admin/whatsapp/test")
def test_whatsapp() -> dict[str, Any]:
    """Sends a test alert to the owner and returns Meta's reply, to see why order alerts aren't arriving."""
    return whatsapp.diagnose(owner_whatsapp_phone())


def order_item_images(order: dict[str, Any], checkout_images: list[str | None]) -> list[list[str]]:
    """Candidate photos per item, tried in order: the JPEG checkout sends, then the catalogue image."""
    stored: dict[str, str] = {}
    if products_collection is not None:
        product_ids = list({item["productId"] for item in order["items"]})
        try:
            stored = {p["id"]: p.get("image", "") for p in products_collection.find({"id": {"$in": product_ids}}, {"_id": 0, "id": 1, "image": 1})}
        except PyMongoError:
            pass
    return [
        [source for source in (checkout_image, stored.get(item["productId"])) if source]
        for item, checkout_image in zip(order["items"], checkout_images)
    ]


@app.get("/api/admin/orders")
def list_admin_orders() -> list[dict[str, Any]]:
    collection = require_orders_collection()
    return [serialize_product(item) for item in collection.find({}, {"_id": 0}).sort("createdAt", -1)]


@app.get("/api/orders/customer/{customer_email}")
def list_customer_orders(customer_email: str) -> list[dict[str, Any]]:
    collection = require_orders_collection()
    return [serialize_product(item) for item in collection.find({"customerEmail": customer_email.lower()}, {"_id": 0}).sort("createdAt", -1)]


@app.get("/api/orders/track/{tracking_id}")
def track_order(tracking_id: str) -> dict[str, Any]:
    order = require_orders_collection().find_one({"trackingId": tracking_id.strip().upper()}, {"_id": 0})
    if order is None:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    return order


@app.patch("/api/admin/orders/{order_id}")
def update_order(order_id: str, update: OrderUpdate) -> dict[str, Any]:
    collection = require_orders_collection()
    changes = {key: value for key, value in update.model_dump().items() if value is not None}
    result = collection.find_one_and_update({"orderId": order_id}, {"$set": changes}, projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if result is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return result


@app.get("/api/admin/customers")
def list_admin_customers() -> list[dict[str, Any]]:
    customers = require_resource_collection(customers_collection, "customers")
    orders = require_orders_collection()
    documents = list(customers.find({}, {"_id": 0}))
    totals: dict[str, dict[str, float]] = {}
    for order in orders.find({}, {"_id": 0, "customerEmail": 1, "total": 1}):
        email = order.get("customerEmail", "").lower()
        entry = totals.setdefault(email, {"orders": 0, "spent": 0})
        entry["orders"] += 1
        entry["spent"] += order.get("total", 0)
    return [{**customer, "totalOrders": int(totals.get(customer["email"], {}).get("orders", 0)), "totalSpent": totals.get(customer["email"], {}).get("spent", 0), "status": customer.get("status", "active")} for customer in documents]


@app.patch("/api/admin/customers/{email}")
def update_customer_status(email: str, update: CustomerStatusUpdate) -> dict[str, Any]:
    result = require_resource_collection(customers_collection, "customers").find_one_and_update(
        {"email": email.lower()}, {"$set": {"status": update.status}}, projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return result


@app.post("/api/customers", status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerCreate) -> dict[str, Any]:
    collection = require_resource_collection(customers_collection, "customers")
    document = {**customer.model_dump(), "email": customer.email.lower()}
    try:
        collection.update_one(
            {"email": document["email"]},
            {"$set": document, "$setOnInsert": {"status": "active", "createdAt": datetime.now(timezone.utc)}},
            upsert=True,
        )
    except PyMongoError as error:
        raise HTTPException(status_code=409, detail=f"Could not save customer: {error}") from error
    document.pop("_id", None)
    return document


class NewsletterSignup(BaseModel):
    email: str = Field(min_length=3, max_length=254)


@app.post("/api/newsletter", status_code=status.HTTP_201_CREATED)
def subscribe_newsletter(signup: NewsletterSignup) -> dict[str, Any]:
    if client is None:
        raise HTTPException(status_code=503, detail="MongoDB is not configured for newsletter.")
    email = signup.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    try:
        client[settings.mongodb_database].newsletter.update_one(
            {"email": email},
            {"$setOnInsert": {"email": email, "createdAt": datetime.now(timezone.utc)}},
            upsert=True,
        )
    except PyMongoError as error:
        raise HTTPException(status_code=409, detail=f"Could not save subscription: {error}") from error
    return {"email": email}


def available_coupon_filter() -> dict[str, Any]:
    """Coupons shoppers can use: switched on, not past expiry (YYYY-MM-DD), and under their usage limit."""
    return {
        "active": True,
        "expiryDate": {"$gte": datetime.now(timezone.utc).date().isoformat()},
        "$expr": {"$lt": [{"$ifNull": ["$usedCount", 0]}, "$usageLimit"]},
    }


PUBLIC_COUPON_FIELDS = {"_id": 0, "code": 1, "discountType": 1, "discountValue": 1, "expiryDate": 1}


@app.get("/api/coupons")
def list_available_coupons() -> list[dict[str, Any]]:
    collection = require_resource_collection(coupons_collection, "coupons")
    return list(collection.find(available_coupon_filter(), PUBLIC_COUPON_FIELDS).sort("createdAt", -1))


@app.get("/api/coupons/{code}")
def get_available_coupon(code: str) -> dict[str, Any]:
    coupon = require_resource_collection(coupons_collection, "coupons").find_one({**available_coupon_filter(), "code": code.strip().upper()}, PUBLIC_COUPON_FIELDS)
    if coupon is None:
        raise HTTPException(status_code=404, detail="Invalid or expired coupon code")
    return coupon


@app.get("/api/admin/coupons")
def list_coupons() -> list[dict[str, Any]]:
    return [serialize_product(item) for item in require_resource_collection(coupons_collection, "coupons").find({}, {"_id": 0})]


@app.post("/api/admin/coupons", status_code=status.HTTP_201_CREATED)
def create_coupon(coupon: CouponCreate) -> dict[str, Any]:
    collection = require_resource_collection(coupons_collection, "coupons")
    document = {**coupon.model_dump(), "code": coupon.code.upper(), "usedCount": 0, "createdAt": datetime.now(timezone.utc)}
    try:
        collection.insert_one(document)
    except PyMongoError as error:
        raise HTTPException(status_code=409, detail=f"Could not create coupon: {error}") from error
    return serialize_product(document)


@app.patch("/api/admin/coupons/{code}")
def update_coupon(code: str, update: CouponUpdate) -> dict[str, Any]:
    result = require_resource_collection(coupons_collection, "coupons").find_one_and_update({"code": code.upper()}, {"$set": update.model_dump(exclude_none=True)}, projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if result is None:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return result


@app.get("/api/admin/settings")
def get_settings() -> dict[str, str]:
    result = require_resource_collection(settings_collection, "settings").find_one({"key": "store"}, {"_id": 0})
    return result or {"storeName": "Coolman Style Forge", "supportEmail": "support@coolman.in", "phone": "+91 9876543210"}


@app.put("/api/admin/settings")
def update_settings(settings_update: StoreSettings) -> dict[str, str]:
    document = settings_update.model_dump()
    require_resource_collection(settings_collection, "settings").update_one({"key": "store"}, {"$set": {**document, "key": "store"}}, upsert=True)
    return document


@app.get("/api/admin/analytics")
def admin_analytics() -> dict[str, Any]:
    orders = list(require_orders_collection().find({}, {"_id": 0}))
    products = list(require_collection().find({}, {"_id": 0}))
    category_counts = Counter(item.get("category", "Other") for order in orders for item in order.get("items", []))
    daily: dict[str, dict[str, float]] = {}
    for order in orders:
        created = order.get("createdAt")
        day = created.strftime("%a") if isinstance(created, datetime) else "Unknown"
        entry = daily.setdefault(day, {"sales": 0, "orders": 0})
        entry["sales"] += order.get("total", 0)
        entry["orders"] += 1
    return {"totalRevenue": sum(order.get("total", 0) for order in orders), "totalOrders": len(orders), "pendingOrders": sum(order.get("status") in {"placed", "pending"} for order in orders), "totalCustomers": len(list(require_resource_collection(customers_collection, "customers").find({}, {"_id": 1}))), "lowStock": sum(product.get("stock", 0) < 15 for product in products), "categoryShare": [{"name": name, "value": value} for name, value in category_counts.items()], "dailySales": [{"name": name, "sales": values["sales"], "orders": values["orders"]} for name, values in daily.items()]}


@app.get("/api/admin/notifications")
def admin_notifications() -> list[dict[str, str]]:
    notifications: list[dict[str, str]] = []
    orders = require_orders_collection()
    products = require_collection()
    for order in orders.find({}, {"_id": 0, "orderId": 1, "customerName": 1, "createdAt": 1}).sort("createdAt", -1).limit(5):
        notifications.append({"id": f"order-{order['orderId']}", "message": f"New order {order['orderId']} from {order.get('customerName', 'customer')}", "type": "order"})
    for product in products.find({"stock": {"$lt": 15}, "active": True}, {"_id": 0, "id": 1, "name": 1, "stock": 1}).sort("stock", 1).limit(5):
        notifications.append({"id": f"stock-{product['id']}", "message": f"Low stock: {product['name']} ({product.get('stock', 0)} left)", "type": "stock"})
    return notifications
