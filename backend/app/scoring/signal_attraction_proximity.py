"""
Signal 6: Attraction Proximity
Uses Haversine formula to find distance to nearest major attraction.
"""
import math
from typing import List


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Returns distance in meters between two lat/lng points."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def compute_signal(restaurant_lat: float, restaurant_lng: float, attractions: List[dict]) -> tuple:
    """
    Returns (Attraction Proximity Score 0-100, nearest_attraction_name, distance_m).
    < 500m → very high score; > 3000m → low score.
    """
    if not attractions or not restaurant_lat or not restaurant_lng:
        return 30.0, None, None

    min_distance = float("inf")
    nearest_name = None

    for attraction in attractions:
        d = haversine_distance(
            restaurant_lat, restaurant_lng,
            attraction["lat"], attraction["lng"]
        )
        if d < min_distance:
            min_distance = d
            nearest_name = attraction["name"]

    # Normalize: 0m = 100, 3000m+ = 0
    # Use exponential decay
    if min_distance <= 0:
        score = 100.0
    elif min_distance >= 3000:
        score = 0.0
    else:
        score = 100.0 * math.exp(-min_distance / 800.0)

    return round(score, 2), nearest_name, round(min_distance, 0)
