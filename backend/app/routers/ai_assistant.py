from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, auth
from app.services.ai_service import generate_restaurant_recommendation # <-- Import the service!

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

# --- Pydantic Schemas ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage]

class AIRecommendation(BaseModel):
    id: int
    name: str
    rating: float
    price: str
    reason: str

class ChatResponse(BaseModel):
    response: str
    recommendations: List[AIRecommendation]

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    user = current_user["user"]
    user_prefs = user.preferences or {}
    
    # 1. Gather Context from DB
    restaurants = db.query(models.Restaurant).order_by(models.Restaurant.average_rating.desc()).limit(20).all()
    db_context = "Available Database Restaurants:\n"
    for r in restaurants:
        db_context += f"- ID: {r.id} | Name: {r.name} | Cuisine: {r.cuisine} | Price: {r.price_tier} | Rating: {r.average_rating}/5.0\n"

    # 2. Format History
    history_text = "\n".join([f"{msg.role.capitalize()}: {msg.content}" for msg in request.conversation_history[-5:]])

    # 3. Call the Service Layer (Clean and simple!)
    ai_result_dict = generate_restaurant_recommendation(
        message=request.message,
        history_text=history_text,
        user_prefs=user_prefs,
        db_context=db_context
    )
    
    # 4. Return the formatted response
    return ChatResponse(**ai_result_dict)