from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: dict = Depends(auth.get_current_user)):
    """Fetch the profile of the currently logged-in user."""
    return current_user["user"]

@router.put("/me", response_model=schemas.UserResponse)
def update_current_user_profile(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Update account settings (name, phone, city, gender, etc.)."""
    user = db.query(models.User).filter(models.User.id == current_user["user"].id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Security: Prevent them from updating their AI preferences through this specific endpoint
    if "preferences" in update_data:
        del update_data["preferences"]
        
    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    return user

@router.get("/preferences")
def get_user_preferences(current_user: dict = Depends(auth.get_current_user)):
    """Fetch the user's saved AI Dining preferences."""
    return {"preferences": current_user["user"].preferences or {}}

@router.put("/preferences")
def update_user_preferences(
    prefs: schemas.UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Update the user's AI Dining preferences (Diet, Budget, Vibe, etc.)."""
    user = db.query(models.User).filter(models.User.id == current_user["user"].id).first()
    user.preferences = prefs.preferences
    db.commit()
    db.refresh(user)
    return {"message": "Preferences updated successfully", "preferences": user.preferences}