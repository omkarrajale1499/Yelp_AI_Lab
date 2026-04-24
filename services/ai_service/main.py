from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
from bson import ObjectId

# --- THE REVERT: Bring back Ollama ---
from langchain_ollama import ChatOllama
from langchain_tavily import TavilySearch
from shared.database import get_db

app = FastAPI(title="AI Assistant Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Grab the local Ollama environment variables
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
TAVILY_API_KEY  = os.getenv("TAVILY_API_KEY")

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, str]] = []

async def get_current_user(authorization: str = Header(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    session = await db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await db.users.find_one({"_id": ObjectId(session["user_id"])})
    return user

@app.post("/api/ai/chat")
async def chat_endpoint(req: ChatRequest, user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_prefs = user.get("preferences", {})
    
    cursor = db.restaurants.find().limit(50)
    db_restaurants = await cursor.to_list(length=50)
    
    db_context_list = []
    for r in db_restaurants:
        db_context_list.append(f"ID: {str(r['_id'])} | Name: {r['name']} | Cuisine: {r.get('cuisine_type')} | Rating: {r.get('average_rating', 0)} | Price: {r.get('price_tier')}")
    db_context = "\n".join(db_context_list)

    history_text = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in req.conversation_history[-4:]])

    # --- THE REVERT: Initialize Ollama with JSON mode enabled ---
    llm = ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=0.1,
        format="json" 
    )
    
    tavily_context = ""
    search_keywords = ["news", "now", "tonight", "events", "trending", "best rated", "open", "new"]
    if TAVILY_API_KEY and any(word in req.message.lower() for word in search_keywords):
        try:
            os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY
            tavily = TavilySearch(max_results=2)
            raw_results = tavily.invoke({"query": f"{req.message} restaurants near me"})
            tavily_context = f"\nLIVE WEB RESULTS (HIGH PRIORITY):\n{raw_results}\n"
        except Exception as e:
            print(f"Tavily Search failed: {e}")

    # We keep the strict guardrails we built earlier so Gemma doesn't hallucinate!
    prompt = f"""
    You are a highly helpful, conversational restaurant discovery assistant for YelpAI.
    USER'S PREFERENCES: {json.dumps(user_prefs)}
    RECENT HISTORY: {history_text}
    AVAILABLE DATABASE RESTAURANTS:
    {db_context}
    {tavily_context}
    
    INSTRUCTIONS:
    1. Analyze the user's message: "{req.message}"
    2. STRICT RULE: If the user is just saying hello, making small talk, or hasn't specifically asked for a restaurant, you MUST leave the "recommendations" array completely EMPTY: [].
    3. If they DO ask for food, find the best matches. You can use 'LIVE WEB RESULTS', but STRICT RULE: You MUST ONLY recommend ACTUAL, specific restaurant names. NEVER use website titles, article names (like "10 Best Restaurants Near Me"), or directories (like TripAdvisor) as a restaurant name.
    4. If a web result does not explicitly mention a specific restaurant, ignore it and use the AVAILABLE DATABASE RESTAURANTS instead.
    5. You MUST output a valid JSON object.
    
    EXPECTED JSON SCHEMA:
    {{
        "response": "Your conversational reply.",
        "recommendations": [
            {{
                "id": "string_id_here", // IMPORTANT: Set exactly to null if this is from LIVE WEB RESULTS
                "name": "Actual Restaurant Name (NOT an article title)",
                "rating": 4.5, 
                "price": "$$",
                "reason": "Why you recommend this."
            }}
        ]
    }}
    """
    
    result = llm.invoke(prompt)
    
    clean_result = result.content.strip()
    if "```json" in clean_result:
        clean_result = clean_result.split("```json")[1].split("```")[0].strip()
    elif "```" in clean_result:
        clean_result = clean_result.split("```")[1].strip()
        
    parsed_result = json.loads(clean_result)
    return parsed_result