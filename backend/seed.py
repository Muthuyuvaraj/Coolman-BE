from pymongo import MongoClient

from app.main import Settings


SEED_PRODUCTS = [
    {"id": "1", "name": "Essential Black Tee", "price": 799, "originalPrice": 1299, "rating": 4.5, "reviews": 128, "sizes": ["S", "M", "L", "XL", "XXL"], "fabric": "100% Cotton", "category": "Plain T-Shirts", "badge": "trending", "inStock": True, "stock": 45, "active": True, "description": "Premium quality essential black tee.", "colors": ["Black"]},
    {"id": "2", "name": "Cloud White Hoodie", "price": 1999, "originalPrice": 2999, "rating": 4.8, "reviews": 89, "sizes": ["S", "M", "L", "XL"], "fabric": "Cotton Fleece", "category": "Hoodies", "badge": "sale", "inStock": True, "stock": 12, "active": True, "description": "Soft cotton fleece hoodie.", "colors": ["White"]},
    {"id": "3", "name": "Olive Jogger Pants", "price": 1499, "rating": 4.3, "reviews": 67, "sizes": ["M", "L", "XL", "XXL"], "fabric": "Polyester Blend", "category": "Track Pants", "badge": "new", "inStock": True, "stock": 30, "active": True, "description": "Comfortable olive jogger pants.", "colors": ["Olive"]},
    {"id": "4", "name": "Navy Full Sleeve Tee", "price": 999, "rating": 4.6, "reviews": 54, "sizes": ["S", "M", "L", "XL"], "fabric": "Cotton Jersey", "category": "Full Sleeve T-Shirts", "inStock": True, "stock": 55, "active": True, "description": "Everyday cotton jersey tee.", "colors": ["Navy"]},
    {"id": "5", "name": "Athletic Grey Shorts", "price": 899, "originalPrice": 1199, "rating": 4.2, "reviews": 43, "sizes": ["S", "M", "L", "XL", "XXL"], "fabric": "Breathable Cotton", "category": "Shorts", "badge": "sale", "inStock": True, "stock": 8, "active": True, "description": "Breathable everyday shorts.", "colors": ["Grey"]},
    {"id": "6", "name": "Pro Red Jersey Tee", "price": 1299, "rating": 4.7, "reviews": 91, "sizes": ["M", "L", "XL"], "fabric": "Jersey Material", "category": "Jersey Sportswear", "badge": "trending", "inStock": True, "stock": 22, "active": True, "description": "Performance jersey sportswear.", "colors": ["Red"]},
    {"id": "7", "name": "Street Art Custom Tee", "price": 1599, "rating": 4.9, "reviews": 156, "sizes": ["S", "M", "L", "XL", "XXL"], "fabric": "Premium Cotton", "category": "Customized T-Shirts", "badge": "new", "inStock": True, "stock": 38, "active": True, "description": "Premium custom street art tee.", "colors": ["Black", "White"]},
    {"id": "8", "name": "Midnight Black Hoodie", "price": 2199, "originalPrice": 2999, "rating": 4.4, "reviews": 72, "sizes": ["S", "M", "L", "XL"], "fabric": "Cotton Fleece", "category": "Hoodies", "badge": "sale", "inStock": True, "stock": 15, "active": True, "description": "Heavyweight black fleece hoodie.", "colors": ["Black"]},
]

settings = Settings()
if not settings.mongodb_uri:
    raise RuntimeError("Set MONGODB_URI in backend/.env before seeding")

client = MongoClient(settings.mongodb_uri)
products_collection = client[settings.mongodb_database].products

for product in SEED_PRODUCTS:
    products_collection.update_one({"id": product["id"]}, {"$setOnInsert": product}, upsert=True)

print(f"Seeded {len(SEED_PRODUCTS)} products")
client.close()
