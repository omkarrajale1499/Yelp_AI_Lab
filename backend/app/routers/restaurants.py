from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_  # <-- Added this import for multi-column searching
from typing import List, Optional
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])

@router.post("/", response_model=schemas.RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    restaurant: schemas.RestaurantCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Add a new restaurant to the platform. Requires authentication."""
    new_restaurant = models.Restaurant(**restaurant.model_dump())
    
    # If an owner is creating this, automatically link it to their account
    if current_user["role"] == "owner":
        new_restaurant.owner_id = current_user["user"].id
        
    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)
    return new_restaurant

@router.get("/", response_model=List[schemas.RestaurantResponse])
def get_restaurants(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None,
    location: Optional[str] = None,
    cuisine: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Fetch a list of all restaurants. Includes optional search and cuisine filters."""
    query = db.query(models.Restaurant)
    
    # Apply search filter across name, cuisine
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Restaurant.name.ilike(search_term),
                models.Restaurant.cuisine.ilike(search_term),
                models.Restaurant.description.ilike(search_term)
            )
        )

    # Location filter (checks city)
    if location:
        location_term = f"%{location}%"
        query = query.filter(
            or_(
                models.Restaurant.city.ilike(location_term),
                models.Restaurant.address.ilike(location_term)
            )
        )


    # Apply specific cuisine filter if provided separately
    if cuisine:
        query = query.filter(models.Restaurant.cuisine.ilike(f"%{cuisine}%"))
        
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=schemas.RestaurantResponse)
def get_restaurant(id: int, db: Session = Depends(get_db)):
    """Fetch the details of a single restaurant by its ID."""
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@router.put("/{id}", response_model=schemas.RestaurantResponse)
def update_restaurant(
    id: int, 
    restaurant_update: schemas.RestaurantUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Update a restaurant's details. Requires authentication."""
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    update_data = restaurant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(restaurant, key, value)
        
    db.commit()
    db.refresh(restaurant)
    return restaurant

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(
    id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Delete a restaurant from the platform. Requires authentication."""
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    db.delete(restaurant)
    db.commit()
    return {"message": "Restaurant deleted successfully"}