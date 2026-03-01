from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app import models

router = APIRouter()

@router.get("/restaurants")
def list_restaurants(city: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Restaurant)
    if city:
        query = query.filter(models.Restaurant.city.ilike(f"%{city}%"))
    restaurants = query.all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "cuisine": r.cuisine,
            "city": r.city,
            "lat": r.lat,
            "lng": r.lng,
            "avg_price": float(r.avg_price) if r.avg_price else None,
            "address": r.address,
        }
        for r in restaurants
    ]


@router.get("/search")
def search_restaurants(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    restaurants = (
        db.query(models.Restaurant)
        .filter(models.Restaurant.name.ilike(f"%{q}%"))
        .limit(10)
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "cuisine": r.cuisine,
            "city": r.city,
            "lat": r.lat,
            "lng": r.lng,
            "avg_price": float(r.avg_price) if r.avg_price else None,
        }
        for r in restaurants
    ]
