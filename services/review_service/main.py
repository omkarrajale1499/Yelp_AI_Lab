from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
from contextlib import asynccontextmanager
from pydantic import BaseModel
import uuid
import datetime
from bson import ObjectId

from .producer import get_kafka_producer, send_review_event
from shared.database import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_kafka_producer()
    yield
    from .producer import producer
    if producer:
        await producer.stop()

app = FastAPI(title="Review API Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewPayload(BaseModel):
    rating: float
    comment: str

# --- SECURITY: Extract user_id from token ---
async def get_current_user(authorization: str = Header(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    return session["user_id"]

# --- MONGODB READ ENDPOINTS ---

@app.get("/api/restaurants/{restaurant_id}/reviews", status_code=status.HTTP_200_OK)
async def get_restaurant_reviews(restaurant_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.reviews.find({"restaurant_id": restaurant_id}).sort("created_at", -1)
    reviews = await cursor.to_list(length=200)
    for rev in reviews:
        rev["id"] = str(rev.pop("_id"))
    return reviews

@app.get("/api/reviews/me", status_code=status.HTTP_200_OK)
async def get_my_reviews(user_id: str = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.reviews.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    reviews = await cursor.to_list(length=50)
    for rev in reviews:
        rev["id"] = str(rev.pop("_id"))
    return reviews


# --- KAFKA WRITE ENDPOINTS (Asynchronous) ---

@app.post("/api/restaurants/{restaurant_id}/reviews", status_code=status.HTTP_202_ACCEPTED)
async def create_review(restaurant_id: str, review: ReviewPayload, user_id: str = Depends(get_current_user)):
    request_id = str(uuid.uuid4())
    
    # THE FIX: user_id is now safely attached to the message!
    kafka_message = {
        "request_id": request_id,
        "user_id": str(user_id),
        "restaurant_id": restaurant_id,
        "rating": review.rating,
        "comment": review.comment,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "action": "create"
    }
    
    try:
        await send_review_event("review.created", kafka_message)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to enqueue review")
    
    return {"id": request_id, "restaurant_id": restaurant_id, "rating": review.rating, "comment": review.comment}

@app.put("/api/reviews/{review_id}", status_code=status.HTTP_202_ACCEPTED)
async def update_review(review_id: str, review: ReviewPayload, user_id: str = Depends(get_current_user)):
    request_id = str(uuid.uuid4())
    kafka_message = {
        "request_id": request_id,
        "review_id": review_id,
        "rating": review.rating,
        "comment": review.comment,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "action": "update"
    }
    
    try:
        await send_review_event("review.updated", kafka_message)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update review")

    return {"id": review_id, "rating": review.rating, "comment": review.comment}

@app.delete("/api/reviews/{review_id}", status_code=status.HTTP_202_ACCEPTED)
async def delete_review(review_id: str, user_id: str = Depends(get_current_user)):
    request_id = str(uuid.uuid4())
    kafka_message = {
        "request_id": request_id,
        "review_id": review_id,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "action": "delete"
    }
    
    try:
        await send_review_event("review.deleted", kafka_message)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete review")

    return {"message": "Review deletion queued", "status": "pending"}