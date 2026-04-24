from pydantic import BaseModel
from typing import Optional

class RestaurantCreate(BaseModel):
    owner_id: Optional[str] = None  # Now strictly Optional!
    name: str
    cuisine_type: str
    address: str
    city: str
    description: Optional[str] = None
    price_tier: Optional[str] = None
    phone: Optional[str] = None
    hours: Optional[str] = None
    amenities: Optional[str] = None