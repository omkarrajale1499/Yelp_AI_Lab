from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
from contextlib import asynccontextmanager
import datetime
from bson import ObjectId

# Make sure UserProfileUpdate is imported from schemas
from .schemas import UserCreate, UserLogin, UserProfileUpdate
from .auth import get_password_hash, verify_password, create_access_token
from .producer import get_kafka_producer, send_kafka_event
from shared.database import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_kafka_producer()
    yield
    from .producer import producer
    if producer:
        await producer.stop()

app = FastAPI(title="User API Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY DEPENDENCY ---
async def get_current_user(authorization: str = Header(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Extracts the Bearer token from the request, finds the active session in MongoDB,
    and returns the authenticated user document.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    session = await db.sessions.find_one({"token": token})
    
    if not session or session["expires_at"] < datetime.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
        
    user = await db.users.find_one({"_id": ObjectId(session["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user["id"] = str(user.pop("_id")) # Safely convert ObjectId to string for JSON serialization
    return user


# --- AUTH ENDPOINTS ---

@app.post("/api/users/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    # UPDATED: Now saves role and restaurantLocation to the database
    user_doc = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_password,
        "role": getattr(user, 'role', 'user'), 
        "restaurantLocation": getattr(user, 'restaurantLocation', None),
        "created_at": datetime.datetime.utcnow()
    }

    result = await db.users.insert_one(user_doc)
    return {"message": "User created successfully", "id": str(result.inserted_id)}

@app.post("/api/users/login")
async def login(user: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    db_user = await db.users.find_one({"email": user.email})
    
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(
        data={"sub": db_user["email"], "role": db_user.get("role", "user")}
    )

    session_doc = {
        "user_id": str(db_user["_id"]),
        "token": access_token,
        "created_at": datetime.datetime.utcnow(),
        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=60)
    }
    await db.sessions.insert_one(session_doc)

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": str(db_user["_id"]),
            "name": db_user["name"],
            "email": db_user["email"],
            "role": db_user.get("role", "user")
        }
    }


# --- PROFILE ENDPOINTS ---

@app.get("/api/users/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Returns the profile of the currently logged-in user."""
    current_user.pop("hashed_password", None) # Never return the password hash!
    return current_user

@app.put("/api/users/me")
async def update_profile(
    profile_data: UserProfileUpdate, 
    current_user: dict = Depends(get_current_user), 
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Updates the 'About Me' and settings fields in MongoDB."""
    # Convert Pydantic model to a dict, but only include fields the user actually sent
    update_dict = profile_data.dict(exclude_unset=True)
    
    if update_dict:
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_dict}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    updated_user["id"] = str(updated_user.pop("_id"))
    updated_user.pop("hashed_password", None)
    return updated_user

@app.put("/api/users/preferences")
async def update_preferences(
    prefs_payload: dict, 
    current_user: dict = Depends(get_current_user), 
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Updates the AI Preferences (LangChain logic inputs)."""
    prefs_data = prefs_payload.get("preferences", {})
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"preferences": prefs_data}}
    )
    return {"message": "Preferences updated"}

# --- STUB ENDPOINTS (To prevent React from crashing) ---

@app.get("/api/favorites/")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    return [] # Return empty for now so the UI doesn't crash

@app.post("/api/users/me/photo")
async def upload_photo(current_user: dict = Depends(get_current_user)):
    raise HTTPException(status_code=501, detail="Photo uploads temporarily disabled during microservice migration.")