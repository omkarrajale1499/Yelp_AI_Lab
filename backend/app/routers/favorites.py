from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.post("/{restaurant_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    restaurant_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Bookmark a restaurant to the user's favorites list."""
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    # Check if already favorited
    existing_fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user["user"].id,
        models.Favorite.restaurant_id == restaurant_id
    ).first()
    
    if existing_fav:
        return {"message": "Restaurant is already in your favorites"}
        
    new_fav = models.Favorite(
        user_id=current_user["user"].id,
        restaurant_id=restaurant_id
    )
    db.add(new_fav)
    db.commit()
    return {"message": "Restaurant added to favorites"}

@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    restaurant_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Remove a restaurant from the user's favorites list."""
    fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user["user"].id,
        models.Favorite.restaurant_id == restaurant_id
    ).first()
    
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
        
    db.delete(fav)
    db.commit()
    return {"message": "Restaurant removed from favorites"}

@router.get("/", response_model=List[schemas.RestaurantResponse])
def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Get all restaurants favorited by the logged-in user."""
    user = db.query(models.User).filter(models.User.id == current_user["user"].id).first()
    
    # Extract the actual Restaurant objects from the user's favorites relationship
    favorite_restaurants = [fav.restaurant for fav in user.favorites]
    return favorite_restaurants