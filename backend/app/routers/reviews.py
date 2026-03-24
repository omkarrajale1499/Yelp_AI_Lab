from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

# Note: Some routes are nested under /restaurants to follow RESTful conventions
router = APIRouter(tags=["Reviews"])

@router.post("/restaurants/{restaurant_id}/reviews", response_model=schemas.ReviewResponse)
def add_review(
    restaurant_id: int, 
    review: schemas.ReviewCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Add a review for a specific restaurant and update its average rating."""
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    # Check if user already reviewed this restaurant
    existing_review = db.query(models.Review).filter(
        models.Review.restaurant_id == restaurant_id,
        models.Review.user_id == current_user["user"].id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this restaurant")

    new_review = models.Review(
        user_id=current_user["user"].id,
        restaurant_id=restaurant_id,
        **review.model_dump()
    )
    db.add(new_review)

    # Update Restaurant Rating Math
    restaurant.review_count += 1
    # Moving average formula
    restaurant.average_rating = restaurant.average_rating + ((review.rating - restaurant.average_rating) / restaurant.review_count)

    db.commit()
    db.refresh(new_review)
    return new_review

@router.get("/restaurants/{restaurant_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_restaurant_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    """Fetch all reviews for a specific restaurant."""
    return db.query(models.Review).filter(models.Review.restaurant_id == restaurant_id).all()

@router.put("/reviews/{review_id}", response_model=schemas.ReviewResponse)
def update_review(
    review_id: int, 
    review_update: schemas.ReviewUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Update a user's own review."""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if review.user_id != current_user["user"].id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this review")
        
    update_data = review_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(review, key, value)
        
    db.commit()
    db.refresh(review)
    return review

@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Delete a user's own review."""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if review.user_id != current_user["user"].id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
        
    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}