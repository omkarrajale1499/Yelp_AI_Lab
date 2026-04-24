from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # -----------------------------------------------------
    # NEW ASSIGNMENT FIELDS: Expanded Profile Information
    # -----------------------------------------------------
    phone_number = Column(String(20), nullable=True)
    about_me = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    country = Column(String(100), nullable=True)
    languages = Column(String(255), nullable=True)
    gender = Column(String(50), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    
    # JSON column for AI Assistant parameters (Diet, Price, Cuisine, Radius, etc.)
    preferences = Column(JSON, nullable=True) 
    
    reviews = relationship("Review", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")

class Owner(Base):
    __tablename__ = "owners"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    restaurants = relationship("Restaurant", back_populates="owner")

class Restaurant(Base):
    __tablename__ = "restaurants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    cuisine = Column(String(50), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price_tier = Column(String(10), nullable=False)
    average_rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True)
    
    owner = relationship("Owner", back_populates="restaurants")
    reviews = relationship("Review", back_populates="restaurant")
    favorites = relationship("Favorite", back_populates="restaurant")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    
    user = relationship("User", back_populates="reviews")
    restaurant = relationship("Restaurant", back_populates="reviews")

class Favorite(Base):
    __tablename__ = "favorites"
    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    
    user = relationship("User", back_populates="favorites")
    restaurant = relationship("Restaurant", back_populates="favorites")