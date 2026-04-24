from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

# --- Users ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    about_me: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    languages: Optional[str] = None
    gender: Optional[str] = None
    profile_picture: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    about_me: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    languages: Optional[str] = None
    gender: Optional[str] = None
    profile_picture: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class UserPreferencesUpdate(BaseModel):
    preferences: Dict[str, Any]

# --- Owners ---
class OwnerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class OwnerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

# --- Restaurants ---
class RestaurantBase(BaseModel):
    name: str
    cuisine: str
    address: str
    city: str
    description: Optional[str] = None
    price_tier: str

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    cuisine: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    price_tier: Optional[str] = None

class RestaurantResponse(RestaurantBase):
    id: int
    average_rating: float
    review_count: int
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Reviews ---
class ReviewCreate(BaseModel):
    rating: int
    comment: str

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str
    user_id: int
    restaurant_id: int

    class Config:
        from_attributes = True

# --- Favorites ---
class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    restaurant: RestaurantResponse

    class Config:
        from_attributes = True