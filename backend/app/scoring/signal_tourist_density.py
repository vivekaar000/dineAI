"""
Signal 2: Surrounding Tourist Density
Uses pre-computed counts of nearby OSM POIs (hotels, attractions, souvenir shops)
within a 300m radius of the restaurant.
"""
from typing import Optional
import httpx
import asyncio

async def fetch_tourist_density(lat: float, lng: float, api_key: str) -> dict:
    """
    Fetch nearby POIs using Google Places Nearby Search.
    Makes concurrent requests for hotels and attractions to evaluate tourist density.
    """
    if not api_key:
        return {"nearby_souvenir_shops": 0, "nearby_hotels": 0, "nearby_tour_offices": 0, "nearby_attractions": 0}

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    async def _fetch_type(poi_type: str) -> int:
        params = {
            "location": f"{lat},{lng}",
            "radius": 300,
            "type": poi_type,
            "key": api_key,
        }
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, params=params)
                data = resp.json()
                if data.get("status") == "OK":
                    return len(data.get("results", []))
                return 0
            except Exception:
                return 0
        return 0

    # Fetch hotels and attractions concurrently
    hotels, attractions = await asyncio.gather(
        _fetch_type("lodging"),
        _fetch_type("tourist_attraction")
    )
    
    return {
        "nearby_souvenir_shops": 0, # harder to pinpoint via single type
        "nearby_hotels": hotels,
        "nearby_tour_offices": 0,
        "nearby_attractions": attractions
    }

def compute_signal(geo_context: dict) -> float:
    """
    Returns Tourist Density Index (0-100).
    Input: dict with keys: nearby_souvenir_shops, nearby_hotels,
           nearby_tour_offices, nearby_attractions.
    """
    if not geo_context:
        return 0.0

    shops = geo_context.get("nearby_souvenir_shops", 0)
    hotels = geo_context.get("nearby_hotels", 0)
    tour_offices = geo_context.get("nearby_tour_offices", 0)
    attractions = geo_context.get("nearby_attractions", 0)

    # Weighted sum: attractions and hotels are strongest signals
    weighted_sum = (
        shops * 1.5 +
        hotels * 2.0 +
        tour_offices * 1.5 +
        attractions * 2.5
    )

    # Cap at 15 weighted units = 100 score (OSM data is sparser than Google Places so we lower the cap)
    score = min(weighted_sum / 15.0, 1.0) * 100.0
    return float(round(score))
