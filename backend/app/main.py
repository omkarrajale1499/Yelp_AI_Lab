from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models
from app.routers import auth, users, restaurants, reviews, favorites, ai_assistant, owners

# Initialize Database tables (this will create tables based on models we define later)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Yelp Clone API",
    description="Restaurant discovery and review system with AI Assistant",
    version="1.0.0"
)

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(reviews.router)
app.include_router(favorites.router)
app.include_router(ai_assistant.router)
app.include_router(owners.router)

@app.get("/")
def health_check():
    return {
        "status": "success", 
        "message": "FastAPI server is running and connected successfully."
    }