from contextlib import asynccontextmanager
from datetime import datetime, timezone
from collections import Counter
from pathlib import Path
from uuid import uuid4
from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from pymongo import ReturnDocument


class Settings(BaseSettings):
    mongodb_uri: str = ""
    mongodb_database: str = "coolman"
    frontend_origin: str = "http://localhost:8080"
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / ".env", extra="ignore")


settings = Settings()


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
    global client, products_collection, orders_collection, customers_collection, coupons_collection, settings_collection

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
            products_collection.create_index([("id", ASCENDING)], unique=True)
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
            raise RuntimeError(f"Unable to connect to MongoDB Atlas: {error}") from error
    else:
        client = None
        products_collection = None
        orders_collection = None
        customers_collection = None
        coupons_collection = None
        settings_collection = None

    yield
    if client is not None:
        client.close()


app = FastAPI(title="Coolman Style Forge API", version="1.0.0", lifespan=lifespan)
allowed_origins = [origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()]
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


@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate) -> dict[str, Any]:
    collection = require_orders_collection()
    document = order.model_dump()
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
        customers = require_resource_collection(customers_collection, "customers")
        customers.update_one(
            {"email": order.customerEmail.lower()},
            {"$set": {"name": order.customerName, "phone": order.phone, "updatedAt": document["createdAt"]}, "$setOnInsert": {"email": order.customerEmail.lower(), "createdAt": document["createdAt"]}},
            upsert=True,
        )
    except PyMongoError as error:
        raise HTTPException(status_code=409, detail=f"Could not create order: {error}") from error
    document.pop("_id", None)
    return document


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
    return [{**customer, "totalOrders": int(totals.get(customer["email"], {}).get("orders", 0)), "totalSpent": totals.get(customer["email"], {}).get("spent", 0), "status": "active"} for customer in documents]


@app.post("/api/customers", status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerCreate) -> dict[str, Any]:
    collection = require_resource_collection(customers_collection, "customers")
    document = {**customer.model_dump(), "email": customer.email.lower(), "status": "active", "createdAt": datetime.now(timezone.utc)}
    try:
        collection.update_one({"email": document["email"]}, {"$set": document}, upsert=True)
    except PyMongoError as error:
        raise HTTPException(status_code=409, detail=f"Could not save customer: {error}") from error
    document.pop("_id", None)
    return document


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
