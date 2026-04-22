"""
Score the remaining ~704 OSM restaurants that don't have pre-computed scores.
This is a standalone script that reads from the static JSON, computes scores
using the heuristic pipeline, and writes the scored results back.

Usage:
    cd backend
    python score_remaining_osm.py
"""
import sys, os, json, math

# ── Inline the scoring logic so we don't need the full app/DB context ──

WEIGHTS = {
    "price_inflation": 0.22,
    "review_linguistics": 0.18,
    "tourist_density": 0.15,
    "menu_engineering": 0.15,
    "repeat_local": 0.15,
    "attraction_proximity": 0.15,
}

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

NASHVILLE_TOURIST_KEYWORDS = [
    "honky tonk", "broadway", "music", "country", "nashville",
    "whiskey", "bourbon", "saloon", "boot", "stage", "live band",
    "rooftop bar", "party barge", "pedal tavern",
    "kid rock", "jason aldean", "blake shelton", "luke bryan",
    "garth", "ole red", "tootsie", "legend",
    "acme feed", "assembly food hall",
]

TOURIST_CUISINE_BOOST = {
    "american": 10, "burger": 5, "bbq": 5,
    "barbecue": 5, "steakhouse": 8, "seafood": 5,
    "international": 8, "fusion": 6,
}

LOCAL_CUISINE_BOOST = {
    "vietnamese": -15, "ethiopian": -18, "korean": -15, "indian": -12,
    "thai": -10, "chinese": -10, "japanese": -8, "mexican": -8,
    "nepali": -18, "laotian": -18, "burmese": -18, "somali": -15,
    "kurdish": -18, "salvadoran": -15, "honduran": -15, "colombian": -12,
    "peruvian": -10, "vegan": -8, "vegetarian": -8, "soul_food": -10,
    "southern": -5, "diner": -10, "deli": -8, "pizza": -5,
    "cafe": -5, "bakery": -8, "breakfast": -5,
}

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

ATTRACTIONS = [
    {"name": "Broadway Strip", "lat": 36.1600, "lng": -86.7797},
    {"name": "Ryman Auditorium", "lat": 36.1612, "lng": -86.7771},
    {"name": "Country Music Hall of Fame", "lat": 36.1582, "lng": -86.7762},
    {"name": "The Parthenon", "lat": 36.1498, "lng": -86.8133},
    {"name": "Bridgestone Arena", "lat": 36.1592, "lng": -86.7785},
    {"name": "Nissan Stadium", "lat": 36.1664, "lng": -86.7713},
    {"name": "Grand Ole Opry", "lat": 36.2054, "lng": -86.6914},
    {"name": "Centennial Park", "lat": 36.1498, "lng": -86.8130},
    {"name": "Nashville Zoo", "lat": 36.0659, "lng": -86.7407},
]


def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def chain_score(name, brand="", wikidata=""):
    name_lower = (name or "").lower().strip()
    brand_lower = (brand or "").lower().strip()
    for chain in TOURIST_CHAINS:
        if chain in name_lower or chain in brand_lower:
            return 85.0
    hits = sum(1 for kw in NASHVILLE_TOURIST_KEYWORDS if kw in name_lower)
    if hits >= 2: return 75.0
    elif hits == 1: return 55.0
    return 0.0


def cuisine_bias(cuisine):
    if not cuisine: return 0.0
    c = cuisine.lower().replace(";", ",")
    for k, v in {**TOURIST_CUISINE_BOOST, **LOCAL_CUISINE_BOOST}.items():
        if k in c:
            return float(v)
    return 0.0


def tourist_zone_score(lat, lng):
    if not lat or not lng: return 30.0
    mx = 0.0
    for z in TOURIST_HOTSPOTS:
        d = haversine(lat, lng, z["lat"], z["lng"])
        if d <= z["radius_m"]:
            s = z["intensity"] * 100.0
        elif d <= z["radius_m"] * 2.5:
            falloff = 1.0 - (d - z["radius_m"]) / (z["radius_m"] * 1.5)
            s = z["intensity"] * 100.0 * max(falloff, 0)
        else:
            s = 0.0
        mx = max(mx, s)
    return round(mx, 2)


def attraction_proximity(lat, lng):
    if not lat or not lng:
        return 30.0, None, None
    min_d = float("inf")
    nearest = None
    for a in ATTRACTIONS:
        d = haversine(lat, lng, a["lat"], a["lng"])
        if d < min_d:
            min_d = d
            nearest = a["name"]
    if min_d <= 0: score = 100.0
    elif min_d >= 3000: score = 0.0
    else: score = 100.0 * math.exp(-min_d / 800.0)
    return round(score, 2), nearest, round(min_d, 0)


def score_osm_restaurant(r):
    """Score a single OSM restaurant using heuristics."""
    name = r.get("name", "")
    cuisine = r.get("cuisine", "")
    lat = r.get("lat")
    lng = r.get("lng")

    # Signal 1: Review Linguistics → chain/name detection
    cs = chain_score(name)
    s1 = cs if cs > 0 else 30.0

    # Signal 2: Tourist Density → zone proximity
    s2 = tourist_zone_score(lat, lng)

    # Signal 3: Price Inflation → cuisine heuristic
    cb = cuisine_bias(cuisine)
    s3 = max(0.0, min(100.0, 40.0 + cb))
    inflation_pct = 0.0

    # Signal 4: Menu Engineering
    if cs >= 75: s4 = 70.0
    elif cs >= 50: s4 = 55.0
    else: s4 = max(0.0, min(100.0, 35.0 + cb * 0.5))

    # Signal 5: Repeat Local → correlated with zone
    s5 = s2 * 0.8

    # Signal 6: Attraction Proximity
    s6, nearest, dist = attraction_proximity(lat, lng)

    # TTS
    tts = (
        WEIGHTS["price_inflation"] * s3 +
        WEIGHTS["review_linguistics"] * s1 +
        WEIGHTS["tourist_density"] * s2 +
        WEIGHTS["menu_engineering"] * s4 +
        WEIGHTS["repeat_local"] * s5 +
        WEIGHTS["attraction_proximity"] * s6
    )
    tts = round(min(max(tts, 0), 100), 2)
    local_auth = round(100 - tts, 2)

    if tts >= 65: label = "tourist"
    elif tts <= 40: label = "mixed"  # more conservative — 40 instead of <40
    else: label = "mixed"
    if tts < 35: label = "local"

    return {
        "tts_score": tts,
        "local_authenticity_score": local_auth,
        "predicted_label": label,
        "signals": {
            "review_linguistics": {"score": round(s1, 1), "label": "Review Linguistics"},
            "tourist_density": {"score": round(s2, 1), "label": "Tourist Density"},
            "price_inflation": {"score": round(s3, 1), "label": "Price Inflation", "inflation_pct": inflation_pct},
            "menu_engineering": {"score": round(s4, 1), "label": "Menu Engineering"},
            "repeat_local": {"score": round(s5, 1), "label": "Repeat Local Proxy"},
            "attraction_proximity": {
                "score": round(s6, 1), "label": "Attraction Proximity",
                "nearest_attraction": nearest,
                "distance_m": dist,
            },
        },
    }


def main():
    json_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "frontend", "public", "nashville_restaurants.json"
    )

    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        sys.exit(1)

    with open(json_path, "r") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} restaurants")

    scored_before = sum(1 for r in data if r.get("tts_score") is not None)
    print(f"Already scored: {scored_before}")
    print(f"Need scoring: {len(data) - scored_before}")

    newly_scored = 0
    for r in data:
        if r.get("tts_score") is not None:
            continue  # Already has scores — skip
        if not r.get("lat") or not r.get("lng"):
            continue  # No coords — can't score

        scores = score_osm_restaurant(r)
        r["tts_score"] = scores["tts_score"]
        r["local_authenticity_score"] = scores["local_authenticity_score"]
        r["predicted_label"] = scores["predicted_label"]
        r["signals"] = scores["signals"]
        newly_scored += 1

    # Write back
    with open(json_path, "w") as f:
        json.dump(data, f, separators=(",", ":"))

    size_kb = os.path.getsize(json_path) / 1024
    total_scored = sum(1 for r in data if r.get("tts_score") is not None)

    print(f"\n✅ Done!")
    print(f"   Newly scored: {newly_scored}")
    print(f"   Total scored: {total_scored}/{len(data)}")
    print(f"   Output: {json_path} ({size_kb:.0f} KB)")

    # Stats breakdown
    labels = {"local": 0, "mixed": 0, "tourist": 0}
    for r in data:
        lbl = r.get("predicted_label")
        if lbl in labels:
            labels[lbl] += 1
    print(f"   Labels: {labels}")


if __name__ == "__main__":
    main()
