import datetime
from bson import ObjectId

# --- NEW HELPER FUNCTION ---
async def update_restaurant_stats(restaurant_id: str, mongo_db):
    """Calculates the true average rating and count, then updates the restaurant document."""
    pipeline = [
        {"$match": {"restaurant_id": restaurant_id}},
        {"$group": {
            "_id": "$restaurant_id",
            "average_rating": {"$avg": "$rating"},
            "review_count": {"$sum": 1}
        }}
    ]
    
    cursor = mongo_db.reviews.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    
    try:
        obj_id = ObjectId(restaurant_id)
        if result:
            stats = result[0]
            await mongo_db.restaurants.update_one(
                {"_id": obj_id},
                {"$set": {
                    "average_rating": round(stats["average_rating"], 1),
                    "review_count": stats["review_count"]
                }}
            )
        else:
            # If all reviews were deleted, reset to 0
            await mongo_db.restaurants.update_one(
                {"_id": obj_id},
                {"$set": {"average_rating": 0.0, "review_count": 0}}
            )
    except Exception as e:
        print(f"Failed to update restaurant stats: {e}")

# --- KAFKA PROCESSORS ---

async def process_review_created(message_value, mongo_db):
    print(f"Processing review creation: {message_value.get('request_id')}")
    restaurant_id = message_value.get("restaurant_id")
    
    review_doc = {
        "user_id": message_value.get("user_id", "anonymous"), 
        "restaurant_id": restaurant_id,
        "rating": float(message_value.get("rating", 0.0)),
        "comment": message_value.get("comment", ""),
        "photos": message_value.get("photos", []),
        "created_at": message_value.get("timestamp", datetime.datetime.utcnow().isoformat()),
        "updated_at": message_value.get("timestamp", datetime.datetime.utcnow().isoformat())
    }
    
    # 1. Insert the review
    await mongo_db.reviews.insert_one(review_doc)
    
    # 2. Update the parent restaurant!
    if restaurant_id:
        await update_restaurant_stats(restaurant_id, mongo_db)

async def process_review_updated(message_value, mongo_db):
    print(f"Processing review update: {message_value.get('request_id')}")
    review_id = message_value.get("review_id")
    if not review_id: return
        
    try:
        obj_id = ObjectId(review_id)
        # We need to fetch the old review to know which restaurant to update
        existing_review = await mongo_db.reviews.find_one({"_id": obj_id})
        if not existing_review: return
        
        update_data = {
            "rating": float(message_value.get("rating", 0.0)),
            "comment": message_value.get("comment", ""),
            "updated_at": message_value.get("timestamp", datetime.datetime.utcnow().isoformat())
        }
        
        await mongo_db.reviews.update_one({"_id": obj_id}, {"$set": update_data})
        await update_restaurant_stats(existing_review["restaurant_id"], mongo_db)
    except Exception as e:
        print(f"Error updating review: {e}")

async def process_review_deleted(message_value, mongo_db):
    print(f"Processing review deletion: {message_value.get('request_id')}")
    review_id = message_value.get("review_id")
    if not review_id: return
        
    try:
        obj_id = ObjectId(review_id)
        existing_review = await mongo_db.reviews.find_one({"_id": obj_id})
        if not existing_review: return
        
        await mongo_db.reviews.delete_one({"_id": obj_id})
        await update_restaurant_stats(existing_review["restaurant_id"], mongo_db)
    except Exception as e:
        print(f"Error deleting review: {e}")

async def process_restaurant_created(message_value, mongo_db):
    print(f"Processing restaurant creation: {message_value.get('name')}")
    restaurant_doc = {
        "owner_id": message_value.get("owner_id"),
        "name": message_value.get("name"),
        "cuisine_type": message_value.get("cuisine_type"),
        "cuisine": message_value.get("cuisine_type"), 
        "address": message_value.get("address"),
        "city": message_value.get("city"),
        "description": message_value.get("description"), 
        "phone": message_value.get("phone"),             
        "hours": message_value.get("hours"),             
        "amenities": message_value.get("amenities"),     
        "created_at": message_value.get("timestamp", datetime.datetime.utcnow().isoformat()),
        "review_count": 0,
        "average_rating": 0.0,
        "price_tier": message_value.get("price_tier", "$$") 
    }
    await mongo_db.restaurants.insert_one(restaurant_doc)