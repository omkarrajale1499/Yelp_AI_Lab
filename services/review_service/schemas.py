from pydantic import BaseModel
from typing import Optional

class ReviewCreate(BaseModel):
    user_id: str
    restaurant_id: str
    rating: int
    comment: str
    photos: Optional[list[str]] = []