from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.scoring.pipeline import score_restaurant
from app.scoring.signal_price_inflation import compute_cuisine_averages
from sqlalchemy import text
from datetime import datetime

router = APIRouter()


def _build_context(restaurant_id: int, db: Session) -> dict:
    # Reviews
    reviews = db.query(models.Review).filter(
        models.Review.restaurant_id == restaurant_id
    ).all()
    reviews_data = [
        {
            "text": r.text,
            "rating": r.rating,
            "sentiment_score": r.sentiment_score or 0.5,
            "tourist_keyword_count": r.tourist_keyword_count or 0,
            "aesthetic_keyword_count": r.aesthetic_keyword_count or 0,
            "quality_keyword_count": r.quality_keyword_count or 0,
        }
        for r in reviews
    ]

    # Menu items
    menu_items = db.query(models.MenuItem).filter(
        models.MenuItem.restaurant_id == restaurant_id
    ).all()
    menu_data = [
        {
            "name": m.name,
            "description": m.description,
            "price": float(m.price) if m.price else 0,
            "has_buzzword": m.has_buzzword,
            "is_combo": m.is_combo,
        }
        for m in menu_items
    ]

    # Reviewer metadata
    meta = db.query(models.ReviewerMetadata).filter(
        models.ReviewerMetadata.restaurant_id == restaurant_id
    ).all()
    meta_data = [
        {
            "reviewer_city": m.reviewer_city,
            "total_reviews_by_user": m.total_reviews_by_user,
            "is_local": m.is_local,
            "is_single_review": m.is_single_review,
        }
        for m in meta
    ]

    # Geo context
    geo = db.query(models.GeoBusinessContext).filter(
        models.GeoBusinessContext.restaurant_id == restaurant_id
    ).first()
    geo_data = (
        {
            "nearby_souvenir_shops": geo.nearby_souvenir_shops,
            "nearby_hotels": geo.nearby_hotels,
            "nearby_tour_offices": geo.nearby_tour_offices,
            "nearby_attractions": geo.nearby_attractions,
        }
        if geo
        else {}
    )

    # Attractions
    attractions = db.query(models.Attraction).all()
    attractions_data = [
        {"name": a.name, "lat": a.lat, "lng": a.lng}
        for a in attractions
    ]

    # Cuisine average
    all_restaurants = db.query(models.Restaurant).all()
    all_rest_data = [
        {"cuisine": r.cuisine, "avg_price": float(r.avg_price) if r.avg_price else 0}
        for r in all_restaurants
    ]
    cuisine_avgs = compute_cuisine_averages(all_rest_data)

    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.id == restaurant_id
    ).first()
    cuisine_avg = cuisine_avgs.get(restaurant.cuisine, 0) if restaurant else 0

    return {
        "reviews": reviews_data,
        "menu_items": menu_data,
        "reviewer_metadata": meta_data,
        "geo_context": geo_data,
        "attractions": attractions_data,
        "cuisine_avg_price": cuisine_avg,
    }


@router.get("/analyze/{restaurant_id}")
def analyze_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.id == restaurant_id
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Check cache
    cached = db.query(models.ScoreCache).filter(
        models.ScoreCache.restaurant_id == restaurant_id
    ).first()

    if cached:
        return {
            "restaurant": {
                "id": restaurant.id,
                "name": restaurant.name,
                "cuisine": restaurant.cuisine,
                "city": restaurant.city,
                "lat": restaurant.lat,
                "lng": restaurant.lng,
                "avg_price": float(restaurant.avg_price) if restaurant.avg_price else None,
                "address": restaurant.address,
            },
            "tts_score": cached.tts_score,
            "local_authenticity_score": cached.local_authenticity_score,
            "signals": {
                "review_linguistics": {"score": cached.review_linguistics_score, "label": "Review Linguistics"},
                "tourist_density": {"score": cached.tourist_density_score, "label": "Tourist Density"},
                "price_inflation": {
                    "score": cached.price_inflation_score,
                    "label": "Price Inflation",
                    "inflation_pct": cached.price_inflation_pct,
                },
                "menu_engineering": {"score": cached.menu_engineering_score, "label": "Menu Engineering"},
                "repeat_local": {"score": cached.repeat_local_score, "label": "Repeat Local Proxy"},
                "attraction_proximity": {"score": cached.attraction_proximity_score, "label": "Attraction Proximity"},
            },
            "cached": True,
        }

    # Compute fresh
    rest_dict = {
        "lat": restaurant.lat,
        "lng": restaurant.lng,
        "avg_price": float(restaurant.avg_price) if restaurant.avg_price else 0,
        "cuisine": restaurant.cuisine,
        "name": restaurant.name,
        "brand": getattr(restaurant, "brand", None),
        "wikidata": getattr(restaurant, "wikidata", None),
    }

    context = _build_context(restaurant_id, db)
    result = score_restaurant(rest_dict, context)

    # Save to cache
    cache = models.ScoreCache(
        restaurant_id=restaurant_id,
        tts_score=result["tts_score"],
        local_authenticity_score=result["local_authenticity_score"],
        price_inflation_score=result["signals"]["price_inflation"]["score"],
        review_linguistics_score=result["signals"]["review_linguistics"]["score"],
        tourist_density_score=result["signals"]["tourist_density"]["score"],
        menu_engineering_score=result["signals"]["menu_engineering"]["score"],
        repeat_local_score=result["signals"]["repeat_local"]["score"],
        attraction_proximity_score=result["signals"]["attraction_proximity"]["score"],
        price_inflation_pct=result["signals"]["price_inflation"].get("inflation_pct", 0),
        computed_at=datetime.utcnow(),
    )
    db.add(cache)
    db.commit()

    return {
        "restaurant": {
            "id": restaurant.id,
            "name": restaurant.name,
            "cuisine": restaurant.cuisine,
            "city": restaurant.city,
            "lat": restaurant.lat,
            "lng": restaurant.lng,
            "avg_price": float(restaurant.avg_price) if restaurant.avg_price else None,
            "address": restaurant.address,
        },
        **result,
        "cached": False,
    }
