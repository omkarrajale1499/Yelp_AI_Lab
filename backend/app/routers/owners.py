from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/owners", tags=["Owners"])

@router.post("/signup", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_owner(owner: schemas.OwnerCreate, db: Session = Depends(get_db)):
    """Register a new restaurant owner."""
    db_owner = db.query(models.Owner).filter(models.Owner.email == owner.email).first()
    if db_owner:
        raise HTTPException(status_code=400, detail="Email already registered as an owner")
    
    hashed_password = auth.get_password_hash(owner.password)
    new_owner = models.Owner(
        name=owner.name, 
        email=owner.email, 
        hashed_password=hashed_password
    )
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    return new_owner

@router.post("/login")
def login_owner(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate an owner and return a JWT token with the 'owner' role."""
    owner = db.query(models.Owner).filter(models.Owner.email == form_data.username).first()
    
    if not owner or not auth.verify_password(form_data.password, owner.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Notice we encode role="owner" into the JWT here
    access_token = auth.create_access_token(data={"sub": str(owner.id), "role": "owner"})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/dashboard")
def get_owner_dashboard(db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    """Fetch analytics and a list of restaurants owned by this user."""
    # Ensure standard users can't access this route
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Not authorized. Owner access only.")
        
    owner = current_user["user"]
    restaurants = db.query(models.Restaurant).filter(models.Restaurant.owner_id == owner.id).all()
    
    # Calculate basic platform stats for this owner
    total_reviews = sum([r.review_count for r in restaurants])
    avg_rating = sum([r.average_rating for r in restaurants]) / len(restaurants) if restaurants else 0.0
    
    return {
        "owner_profile": {"name": owner.name, "email": owner.email},
        "stats": {
            "total_locations": len(restaurants),
            "total_reviews": total_reviews,
            "average_rating": round(avg_rating, 2)
        },
        "restaurants": restaurants
    }

@router.post("/claim/{restaurant_id}")
def claim_restaurant(
    restaurant_id: int, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(auth.get_current_user)
):
    """Allow an owner to claim an unassigned restaurant from the database."""
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only verified owners can claim restaurants.")
        
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found.")
        
    if restaurant.owner_id is not None:
        raise HTTPException(status_code=400, detail="This restaurant has already been claimed.")
        
    # Assign the restaurant to the owner
    restaurant.owner_id = current_user["user"].id
    db.commit()
    return {"message": f"Successfully claimed {restaurant.name}!"}