"""
Main scoring pipeline — combines all 6 signals into TTS.
Enhanced with location-aware heuristics for data-sparse OSM restaurants.
"""
import math
from app.scoring import (
    signal_review_linguistics,
    signal_tourist_density,
    signal_price_inflation,
    signal_menu_classifier,
    signal_repeat_local,
    signal_attraction_proximity,
)

WEIGHTS = {
    "price_inflation": 0.22,
    "review_linguistics": 0.18,
    "tourist_density": 0.15,
    "menu_engineering": 0.15,
    "repeat_local": 0.15,
    "attraction_proximity": 0.15,
}

# ── Known tourist-oriented chains and brands ──
TOURIST_CHAINS = {
    "hard rock cafe", "planet hollywood", "rainforest cafe", "bubba gump",
    "margaritaville", "tgi friday", "tgi fridays", "jimmy buffett",
    "dick's last resort", "coyote ugly", "hooters", "senor frogs",
    "señor frog", "johnny rockets", "the cheesecake factory",
    "buca di beppo", "olive garden", "red lobster", "applebee",
    "chili's", "outback steakhouse", "the old spaghetti factory",
    "ruth's chris", "morton's steakhouse", "mccormick & schmick",
    "chart house", "claim jumper",
}

# Nashville-specific tourist-draw names
NASHVILLE_TOURIST_KEYWORDS = [
    "honky tonk", "broadway", "music", "country", "nashville",
    "whiskey", "bourbon", "saloon", "boot", "stage", "live band",
    "rooftop bar", "party barge", "pedal tavern",
    "kid rock", "jason aldean", "blake shelton", "luke bryan",
    "garth", "ole red", "tootsie", "legend",
    "acme feed", "assembly food hall",
]

# Cuisine types that tend to be more tourist-oriented in Nashville
TOURIST_CUISINE_BOOST = {
    "american": 10, "burger": 5, "bbq": 5,
    "barbecue": 5, "steakhouse": 8, "seafood": 5,
    "international": 8, "fusion": 6,
}

# Cuisine types that tend to be more local/authentic
LOCAL_CUISINE_BOOST = {
    "vietnamese": -15, "ethiopian": -18, "korean": -15, "indian": -12,
    "thai": -10, "chinese": -10, "japanese": -8, "mexican": -8,
    "nepali": -18, "laotian": -18, "burmese": -18, "somali": -15,
    "kurdish": -18, "salvadoran": -15, "honduran": -15, "colombian": -12,
    "peruvian": -10, "vegan": -8, "vegetarian": -8, "soul_food": -10,
    "southern": -5, "diner": -10, "deli": -8, "pizza": -5,
    "cafe": -5, "bakery": -8, "breakfast": -5,
}

# ── Nashville tourist hot-zone centroids ──
TOURIST_HOTSPOTS = [
    {"name": "Lower Broadway", "lat": 36.1610, "lng": -86.7760, "radius_m": 600, "intensity": 1.0},
    {"name": "Music Row", "lat": 36.1510, "lng": -86.7930, "radius_m": 500, "intensity": 0.7},
    {"name": "Midtown / Vanderbilt", "lat": 36.1480, "lng": -86.8030, "radius_m": 400, "intensity": 0.4},
    {"name": "The Gulch", "lat": 36.1525, "lng": -86.7890, "radius_m": 400, "intensity": 0.65},
    {"name": "12 South", "lat": 36.1290, "lng": -86.7910, "radius_m": 300, "intensity": 0.45},
    {"name": "Germantown", "lat": 36.1750, "lng": -86.7830, "radius_m": 350, "intensity": 0.5},
    {"name": "East Nashville", "lat": 36.1750, "lng": -86.7570, "radius_m": 500, "intensity": 0.35},
    {"name": "SoBro", "lat": 36.1570, "lng": -86.7720, "radius_m": 400, "intensity": 0.75},
    {"name": "Printers Alley", "lat": 36.1640, "lng": -86.7780, "radius_m": 200, "intensity": 0.85},
    {"name": "Centennial Park", "lat": 36.1495, "lng": -86.8130, "radius_m": 300, "intensity": 0.4},
]


def _haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _chain_score(name: str, brand: str = "", wikidata: str = "") -> float:
    """Score 0-100 based on whether restaurant is a known tourist chain."""
    name_lower = name.lower().strip() if name else ""
    brand_lower = brand.lower().strip() if brand else ""

    # 1. Definitive chain matching using OSM's brand and wikidata tags
    # Wikidata Q918151 is Hard Rock Cafe, Q1057404 is Bubba Gump
    tourist_wikidata = {"Q918151", "Q1057404", "Q3390013", "Q135384"}
    if wikidata and wikidata in tourist_wikidata:
        return 90.0

    # 2. Exact chain match on name or brand → high tourist score
    for chain in TOURIST_CHAINS:
        if chain in name_lower or chain in brand_lower:
            return 85.0

    # 3. Nashville tourist keyword match in name
    keyword_hits = sum(1 for kw in NASHVILLE_TOURIST_KEYWORDS if kw in name_lower)
    if keyword_hits >= 2:
        return 75.0
    elif keyword_hits == 1:
        return 55.0

    return 0.0  # No chain signal → let other heuristics decide


def _cuisine_bias(cuisine: str) -> float:
    """Returns a score adjustment based on cuisine type."""
    if not cuisine:
        return 0.0
    cuisine_lower = cuisine.lower().replace(";", ",")
    for c, boost in {**TOURIST_CUISINE_BOOST, **LOCAL_CUISINE_BOOST}.items():
        if c in cuisine_lower:
            return float(boost)
    return 0.0


def _tourist_zone_score(lat: float, lng: float) -> float:
    """Score 0-100 based on proximity to Nashville tourist hotspots."""
    if not lat or not lng:
        return 30.0

    max_score = 0.0
    for zone in TOURIST_HOTSPOTS:
        dist = _haversine(lat, lng, zone["lat"], zone["lng"])
        if dist <= zone["radius_m"]:
            # Inside the zone — full intensity
            zone_score = zone["intensity"] * 100.0
        elif dist <= zone["radius_m"] * 2.5:
            # Falloff zone
            falloff = 1.0 - (dist - zone["radius_m"]) / (zone["radius_m"] * 1.5)
            zone_score = zone["intensity"] * 100.0 * max(falloff, 0)
        else:
            zone_score = 0.0
        max_score = max(max_score, zone_score)

    return round(max_score, 2)


def score_restaurant(restaurant: dict, context: dict) -> dict:
    """
    Compute full Tourist Targeting Score for a restaurant.
    Enhanced: uses location-aware heuristics when review/menu data is sparse.
    """
    reviews = context.get("reviews", [])
    menu_items = context.get("menu_items", [])
    reviewer_meta = context.get("reviewer_metadata", [])
    geo_ctx = context.get("geo_context", {})
    attractions = context.get("attractions", [])
    cuisine_avg_price = context.get("cuisine_avg_price", 0)

    lat = restaurant.get("lat")
    lng = restaurant.get("lng")
    name = restaurant.get("name", "")
    cuisine = restaurant.get("cuisine", "")

    # Detect if this is a data-sparse restaurant (OSM-only)
    has_rich_data = bool(reviews) or bool(menu_items) or bool(reviewer_meta)

    if has_rich_data:
        # ── Full scoring with real data ──
        s1 = signal_review_linguistics.compute_signal(reviews)
        s2 = signal_tourist_density.compute_signal(geo_ctx)
        avg_price = float(restaurant.get("avg_price", 0) or 0)
        s3, inflation_pct = signal_price_inflation.compute_signal(avg_price, cuisine_avg_price)
        s4 = signal_menu_classifier.compute_signal(menu_items)
        s5 = signal_repeat_local.compute_signal(reviewer_meta)
        s6, nearest_attraction, distance_m = signal_attraction_proximity.compute_signal(lat, lng, attractions)

    else:
        # ── Heuristic scoring for data-sparse restaurants ──
        brand = restaurant.get("brand")
        wikidata = restaurant.get("wikidata")

        # Signal 1: Review Linguistics → use chain/name detection instead
        chain_s = _chain_score(name, brand, wikidata)
        s1 = chain_s if chain_s > 0 else 30.0  # Default local-leaning

        # Signal 2: Tourist Density → use tourist zone scoring
        s2 = _tourist_zone_score(lat, lng)

        # Signal 3: Price Inflation → use cuisine-based heuristic
        base_price_score = 40.0  # slightly below neutral
        cuisine_adj = _cuisine_bias(cuisine)
        s3 = max(0.0, min(100.0, base_price_score + cuisine_adj))
        inflation_pct = 0.0

        # Signal 4: Menu Engineering → use name/cuisine heuristics
        if chain_s >= 75:
            s4 = 70.0  # Chains have engineered menus
        elif chain_s >= 50:
            s4 = 55.0
        else:
            # Non-chain: cuisine type matters
            s4 = max(0.0, min(100.0, 35.0 + cuisine_adj * 0.5))

        # Signal 5: Repeat Local → proximity-based heuristic
        # Restaurants far from tourist zones are more likely local regulars
        zone_s = _tourist_zone_score(lat, lng)
        s5 = zone_s * 0.8  # Correlated with tourist zone

        # Signal 6: Attraction Proximity — always computed from actual data
        s6, nearest_attraction, distance_m = signal_attraction_proximity.compute_signal(
            lat, lng, attractions
        )

    # ── Compute TTS ──
    tts = (
        WEIGHTS["price_inflation"] * s3 +
        WEIGHTS["review_linguistics"] * s1 +
        WEIGHTS["tourist_density"] * s2 +
        WEIGHTS["menu_engineering"] * s4 +
        WEIGHTS["repeat_local"] * s5 +
        WEIGHTS["attraction_proximity"] * s6
    )

    tts = round(min(max(tts, 0), 100), 2)
    local_authenticity = round(100 - tts, 2)

    # Predicted label
    if tts >= 65:
        predicted_label = "tourist"
    elif tts <= 40:
        predicted_label = "local"
    else:
        predicted_label = "mixed"

    return {
        "tts_score": tts,
        "local_authenticity_score": local_authenticity,
        "predicted_label": predicted_label,
        "signals": {
            "review_linguistics": {"score": s1, "label": "Review Linguistics"},
            "tourist_density": {"score": s2, "label": "Tourist Density"},
            "price_inflation": {
                "score": s3,
                "label": "Price Inflation",
                "inflation_pct": inflation_pct,
            },
            "menu_engineering": {"score": s4, "label": "Menu Engineering"},
            "repeat_local": {"score": s5, "label": "Repeat Local Proxy"},
            "attraction_proximity": {
                "score": s6,
                "label": "Attraction Proximity",
                "nearest_attraction": nearest_attraction,
                "distance_m": distance_m,
            },
        },
        "weights": WEIGHTS,
    }
