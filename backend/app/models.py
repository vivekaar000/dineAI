from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class Restaurant(Base):
    __tablename__ = "restaurants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cuisine = Column(String(100))
    address = Column(Text)
    city = Column(String(100))
    lat = Column(Float)
    lng = Column(Float)
    avg_price = Column(Numeric(10, 2))
    phone = Column(String(50))
    website = Column(String(255))
    brand = Column(String(255))
    wikidata = Column(String(100))
    opening_hours = Column(String(255))
    wheelchair = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)

    reviews = relationship("Review", back_populates="restaurant")
    menu_items = relationship("MenuItem", back_populates="restaurant")
    reviewer_metadata = relationship("ReviewerMetadata", back_populates="restaurant")
    geo_context = relationship("GeoBusinessContext", back_populates="restaurant", uselist=False)
    score_cache = relationship("ScoreCache", back_populates="restaurant", uselist=False)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    text = Column(Text)
    rating = Column(Integer)
    sentiment_score = Column(Float)
    tourist_keyword_count = Column(Integer, default=0)
    aesthetic_keyword_count = Column(Integer, default=0)
    quality_keyword_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="reviews")

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String(255))
    description = Column(Text)
    price = Column(Numeric(10, 2))
    category = Column(String(100))
    has_buzzword = Column(Boolean, default=False)
    is_combo = Column(Boolean, default=False)

    restaurant = relationship("Restaurant", back_populates="menu_items")

class ReviewerMetadata(Base):
    __tablename__ = "reviewer_metadata"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    reviewer_city = Column(String(100))
    total_reviews_by_user = Column(Integer)
    is_local = Column(Boolean)
    is_single_review = Column(Boolean)

    restaurant = relationship("Restaurant", back_populates="reviewer_metadata")

class GeoBusinessContext(Base):
    __tablename__ = "geo_business_context"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), unique=True)
    nearby_souvenir_shops = Column(Integer, default=0)
    nearby_hotels = Column(Integer, default=0)
    nearby_tour_offices = Column(Integer, default=0)
    nearby_attractions = Column(Integer, default=0)
    tourist_density_index = Column(Float, default=0)

    restaurant = relationship("Restaurant", back_populates="geo_context")

class Attraction(Base):
    __tablename__ = "attractions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    city = Column(String(100))
    lat = Column(Float)
    lng = Column(Float)

class ValidationLabel(Base):
    __tablename__ = "validation_labels"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    true_label = Column(String(50))
    predicted_score = Column(Float)
    predicted_label = Column(String(50))
    submitted_at = Column(DateTime, default=datetime.utcnow)

class ScoreCache(Base):
    __tablename__ = "score_cache"
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), unique=True)
    tts_score = Column(Float)
    local_authenticity_score = Column(Float)
    price_inflation_score = Column(Float)
    review_linguistics_score = Column(Float)
    tourist_density_score = Column(Float)
    menu_engineering_score = Column(Float)
    repeat_local_score = Column(Float)
    attraction_proximity_score = Column(Float)
    price_inflation_pct = Column(Float)
    computed_at = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="score_cache")
