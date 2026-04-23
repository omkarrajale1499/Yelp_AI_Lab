from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
from contextlib import asynccontextmanager
import uuid
import datetime
from bson import ObjectId

from .schemas import RestaurantCreate
from .producer import get_producer, send_event
from shared.database import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_producer()
    yield
    from .producer import producer
    if producer:
        await producer.stop()

app = FastAPI(title="Restaurant API Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MONGODB READ ENDPOINTS ---

@app.get("/api/restaurants", status_code=status.HTTP_200_OK)
async def get_restaurants(
    search: str = Query(None, description="Search by name"),
    location: str = Query(None, description="Search by city"),
    owner_id: str = Query(None, description="Filter by owner ID"), # Added owner filter!
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if location:
        query["city"] = {"$regex": location, "$options": "i"}
    if owner_id:
        query["owner_id"] = owner_id # Let the dashboard fetch its own restaurants
        
    cursor = db.restaurants.find(query)
    restaurants = await cursor.to_list(length=100)
    
    for rest in restaurants:
        rest["id"] = str(rest.pop("_id"))
        
    return restaurants

@app.get("/api/restaurants/{restaurant_id}", status_code=status.HTTP_200_OK)
async def get_restaurant_by_id(restaurant_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        obj_id = ObjectId(restaurant_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid restaurant ID format")
        
    restaurant = await db.restaurants.find_one({"_id": obj_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    restaurant["id"] = str(restaurant.pop("_id"))
    return restaurant


# --- CLAIM ENDPOINT ---

@app.put("/api/restaurants/{restaurant_id}/claim", status_code=status.HTTP_200_OK)
async def claim_restaurant(restaurant_id: str, payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Allows an owner to claim an unclaimed restaurant."""
    try:
        obj_id = ObjectId(restaurant_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid restaurant ID")
        
    owner_id = payload.get("owner_id")
    if not owner_id:
        raise HTTPException(status_code=400, detail="owner_id is required to claim")
        
    # Security: Only update if the owner_id is currently null, empty, or doesn't exist
    result = await db.restaurants.update_one(
        {"_id": obj_id, "$or": [{"owner_id": None}, {"owner_id": ""}, {"owner_id": {"$exists": False}}]},
        {"$set": {"owner_id": owner_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Restaurant is already claimed or not found.")
        
    return {"message": "Restaurant successfully claimed!"}


# --- KAFKA WRITE ENDPOINTS (Asynchronous) ---

@app.post("/api/restaurants", status_code=status.HTTP_202_ACCEPTED)
async def create_restaurant(restaurant: RestaurantCreate):
    request_id = str(uuid.uuid4())
    
    kafka_message = {
        "request_id": request_id,
        "owner_id": restaurant.owner_id,
        "name": restaurant.name,
        "cuisine_type": restaurant.cuisine_type,
        "address": restaurant.address,
        "city": restaurant.city,
        "description": restaurant.description,
        "price_tier": restaurant.price_tier,
        "phone": restaurant.phone,
        "hours": restaurant.hours,
        "amenities": restaurant.amenities,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "action": "create"
    }

    try:
        await send_event("restaurant.created", kafka_message)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to enqueue restaurant creation")

    return {"message": "Restaurant creation queued", "request_id": request_id}