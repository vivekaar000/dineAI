"""
Google Places API router — live restaurant search and nearby POI data.
"""
import httpx
from fastapi import APIRouter, HTTPException, Query
from app.config import settings

router = APIRouter()

PLACES_TEXT_SEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_DETAILS    = "https://maps.googleapis.com/maps/api/place/details/json"
PLACES_NEARBY     = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


@router.get("/places/search")
async def places_search(q: str = Query(..., min_length=1)):
    """Search for restaurants by name via Google Places Text Search."""
    params = {
        "query": f"{q} restaurant",
        "type": "restaurant",
        "key": settings.google_places_api_key,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(PLACES_TEXT_SEARCH, params=params)
        data = resp.json()

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(status_code=502, detail=f"Places API error: {data.get('status')}")

    results = []
    for place in data.get("results", [])[:10]:
        loc = place.get("geometry", {}).get("location", {})
        results.append({
            "place_id": place.get("place_id"),
            "name": place.get("name"),
            "address": place.get("formatted_address"),
            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "rating": place.get("rating"),
            "price_level": place.get("price_level"),
            "types": place.get("types", []),
        })
    return results


@router.get("/places/details/{place_id}")
async def places_details(place_id: str):
    """Get detailed info for a Google Place ID."""
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,geometry,rating,price_level,reviews,types,opening_hours",
        "key": settings.google_places_api_key,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(PLACES_DETAILS, params=params)
        data = resp.json()

    if data.get("status") != "OK":
        raise HTTPException(status_code=502, detail=f"Places API error: {data.get('status')}")

    result = data.get("result", {})
    loc = result.get("geometry", {}).get("location", {})

    reviews = []
    for r in result.get("reviews", []):
        reviews.append({
            "text": r.get("text", ""),
            "rating": r.get("rating"),
            "author": r.get("author_name"),
            "relative_time": r.get("relative_time_description"),
        })

    return {
        "place_id": place_id,
        "name": result.get("name"),
        "address": result.get("formatted_address"),
        "lat": loc.get("lat"),
        "lng": loc.get("lng"),
        "rating": result.get("rating"),
        "price_level": result.get("price_level"),
        "types": result.get("types", []),
        "reviews": reviews,
    }


@router.get("/places/density")
async def places_density(lat: float, lng: float):
    """
    Fetch real tourist density data via Google Places Nearby Search.
    Returns counts for souvenir shops, hotels, tour offices, and attractions
    within 300m of the given coordinates.
    """
    from app.scoring.signal_tourist_density import fetch_tourist_density, compute_signal
    api_key = settings.google_places_api_key
    geo_data = await fetch_tourist_density(lat, lng, api_key)
    score = compute_signal(geo_data)
    return {
        "lat": lat,
        "lng": lng,
        "nearby_pois": geo_data,
        "tourist_density_score": score,
    }


@router.get("/places/analyze-live/{place_id}")
async def analyze_live(place_id: str):
    """
    Full TTS analysis for a Google Place ID (not in local DB).
    Fetches real data from Places API and runs the scoring pipeline.
    """
    from app.scoring.pipeline import score_restaurant
    from app.scoring.signal_tourist_density import fetch_tourist_density, compute_signal as density_score
    from app.scoring.signal_review_linguistics import analyze_review
    from app.scoring.signal_menu_classifier import compute_signal as menu_score

    api_key = settings.google_places_api_key

    # Get place details
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,geometry,rating,price_level,reviews,types",
        "key": api_key,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(PLACES_DETAILS, params=params)
        data = resp.json()

    if data.get("status") != "OK":
        raise HTTPException(status_code=502, detail=f"Places API error: {data.get('status')}")

    result = data.get("result", {})
    loc = result.get("geometry", {}).get("location", {})
    lat = loc.get("lat", 0)
    lng = loc.get("lng", 0)

    # Map price_level (0–4) to estimated avg_price
    price_map = {0: 8, 1: 15, 2: 28, 3: 48, 4: 80}
    price_level = result.get("price_level", 2) or 2
    avg_price = price_map.get(price_level, 28)

    # Analyze reviews
    raw_reviews = result.get("reviews", [])
    analyzed_reviews = []
    for r in raw_reviews:
        text = r.get("text", "")
        if text:
            analysis = analyze_review(text)
            analysis["text"] = text
            analyzed_reviews.append(analysis)

    # Fetch real nearby POI density
    geo_data = await fetch_tourist_density(lat, lng, api_key)

    # Build restaurant and context for pipeline
    restaurant = {
        "lat": lat,
        "lng": lng,
        "avg_price": avg_price,
        "cuisine": "Restaurant",  # generic since Places doesn't give cuisine type
    }

    # Use generic attractions list (major world landmarks)
    attractions = [
        {"name": "Times Square", "lat": 40.7580, "lng": -73.9855},
        {"name": "Central Park", "lat": 40.7851, "lng": -73.9683},
        {"name": "Eiffel Tower", "lat": 48.8584, "lng": 2.2945},
        {"name": "Louvre Museum", "lat": 48.8606, "lng": 2.3376},
        {"name": "Broadway Strip Nashville", "lat": 36.1600, "lng": -86.7797},
        {"name": "Colosseum", "lat": 41.8902, "lng": 12.4922},
        {"name": "Big Ben", "lat": 51.5007, "lng": -0.1246},
        {"name": "Sagrada Familia", "lat": 41.4036, "lng": 2.1744},
        {"name": "Shibuya Crossing", "lat": 35.6595, "lng": 139.7004},
    ]

    # Reviewer metadata: all Places reviewers treated as unknown origin
    reviewer_metadata = [
        {"reviewer_city": "unknown", "total_reviews_by_user": 1, "is_local": False, "is_single_review": True}
        for _ in raw_reviews
    ]

    context = {
        "reviews": analyzed_reviews,
        "menu_items": [],  # Places API doesn't provide menu
        "reviewer_metadata": reviewer_metadata,
        "geo_context": geo_data,
        "attractions": attractions,
        "cuisine_avg_price": avg_price * 0.75,  # estimate city avg as 25% cheaper
    }

    scores = score_restaurant(restaurant, context)

    return {
        "place_id": place_id,
        "restaurant": {
            "name": result.get("name"),
            "address": result.get("formatted_address"),
            "lat": lat,
            "lng": lng,
            "avg_price": avg_price,
            "google_rating": result.get("rating"),
            "price_level": price_level,
        },
        "geo_data": geo_data,
        **scores,
    }
