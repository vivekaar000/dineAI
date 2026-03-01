"""
OSM Nashville Restaurant Loader
Parses the Overpass API JSON and upserts restaurants into the database.
Also calculates local Tourist Density purely from OSM POIs (no API calls).
Run: python app/osm_loader.py
"""
import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal, engine
from app import models

models.Base.metadata.create_all(bind=engine)

OSM_FILE = os.path.join(os.path.dirname(__file__), "osm_nashville.json")
POIS_FILE = os.path.join(os.path.dirname(__file__), "osm_pois.json")


def _haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def load_pois():
    if not os.path.exists(POIS_FILE):
        return []
    with open(POIS_FILE) as f:
        data = json.load(f)
        
    pois = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        
        if el["type"] == "node":
            lat = el.get("lat")
            lon = el.get("lon")
        elif el["type"] == "way":
            center = el.get("center", {})
            lat = center.get("lat")
            lon = center.get("lon")
        else:
            continue
            
        if not lat or not lon:
            continue
            
        poi_temp = {"lat": lat, "lng": lon}
        if tags.get("tourism") == "hotel":
            poi_temp["type"] = "hotel"
        elif tags.get("tourism") in ["attraction", "museum"] or tags.get("historic") == "monument":
            poi_temp["type"] = "attraction"
        elif tags.get("shop") in ["souvenir", "ticket"]:
            poi_temp["type"] = "souvenir"
        else:
            continue
            
        pois.append(poi_temp)
    return pois


def parse_osm(data: dict) -> list[dict]:
    """Convert OSM elements into clean restaurant dicts."""
    restaurants = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})

        name = tags.get("name", "").strip()
        if not name:
            continue

        if el["type"] == "node":
            lat = el.get("lat")
            lon = el.get("lon")
        elif el["type"] == "way":
            center = el.get("center", {})
            lat = center.get("lat")
            lon = center.get("lon")
        else:
            continue

        if lat is None or lon is None:
            continue

        if not (35.8 <= lat <= 36.5 and -87.2 <= lon <= -86.4):
            continue

        cuisine = tags.get("cuisine", "").replace(";", ", ")[:100] or None
        address = tags.get("address") or None
        if not address:
            address_parts = []
            if tags.get("addr:housenumber"):
                address_parts.append(tags["addr:housenumber"])
            if tags.get("addr:street"):
                address_parts.append(tags["addr:street"])
            address = " ".join(address_parts) or None

        city = tags.get("addr:city") or "Nashville"
        phone = tags.get("phone") or tags.get("contact:phone") or None
        website = tags.get("website") or tags.get("contact:website") or None
        
        # New rich tags
        brand = tags.get("brand") or None
        wikidata = tags.get("brand:wikidata") or tags.get("wikidata") or None
        opening_hours = tags.get("opening_hours") or None
        wheelchair_val = tags.get("wheelchair")
        wheelchair = True if wheelchair_val == "yes" else False if wheelchair_val == "no" else None

        restaurants.append({
            "osm_id": str(el["id"]),
            "name": name,
            "cuisine": cuisine,
            "city": city,
            "lat": lat,
            "lng": lon,
            "address": address,
            "phone": phone,
            "website": website,
            "brand": brand,
            "wikidata": wikidata,
            "opening_hours": opening_hours,
            "wheelchair": wheelchair
        })

    return restaurants


def load():
    if not os.path.exists(OSM_FILE):
        print(f"OSM file not found: {OSM_FILE}")
        return

    with open(OSM_FILE) as f:
        data = json.load(f)

    restaurants = parse_osm(data)
    pois = load_pois()
    print(f"Parsed {len(restaurants)} Nashville restaurants and {len(pois)} POIs from OSM data")

    db = SessionLocal()
    try:
        inserted = 0
        updated = 0
        for r in restaurants:
            existing = db.query(models.Restaurant).filter(
                models.Restaurant.name == r["name"],
                models.Restaurant.lat.between(r["lat"] - 0.0001, r["lat"] + 0.0001),
                models.Restaurant.lng.between(r["lng"] - 0.0001, r["lng"] + 0.0001),
            ).first()

            if existing:
                # Update existing with rich OSM tags
                existing.brand = r["brand"]
                existing.wikidata = r["wikidata"]
                existing.opening_hours = r["opening_hours"]
                existing.website = r["website"] or existing.website
                existing.wheelchair = r["wheelchair"]
                restaurant_id = existing.id
                updated += 1
            else:
                restaurant = models.Restaurant(
                    name=r["name"], cuisine=r["cuisine"], city=r["city"],
                    lat=r["lat"], lng=r["lng"], address=r["address"],
                    phone=r["phone"], website=r["website"], brand=r["brand"],
                    wikidata=r["wikidata"], opening_hours=r["opening_hours"],
                    wheelchair=r["wheelchair"], avg_price=None,
                )
                db.add(restaurant)
                db.commit() # Commit to get ID
                db.refresh(restaurant)
                restaurant_id = restaurant.id
                inserted += 1

            # Calculate actual OSM Tourist Density purely locally!
            hotels = 0
            attractions = 0
            souvenirs = 0
            
            for poi in pois:
                dist = _haversine(r["lat"], r["lng"], poi["lat"], poi["lng"])
                if dist <= 300:
                    if poi["type"] == "hotel": hotels += 1
                    elif poi["type"] == "attraction": attractions += 1
                    elif poi["type"] == "souvenir": souvenirs += 1

            geo = db.query(models.GeoBusinessContext).filter(
                models.GeoBusinessContext.restaurant_id == restaurant_id
            ).first()
            
            if not geo:
                geo = models.GeoBusinessContext(restaurant_id=restaurant_id)
                db.add(geo)
                
            geo.nearby_hotels = hotels
            geo.nearby_attractions = attractions
            geo.nearby_souvenir_shops = souvenirs
            geo.nearby_tour_offices = 0

            db.commit()

        print(f"Inserted {inserted}, updated {updated} restaurants with rich OSM tags and pre-computed density.")
    finally:
        db.close()


if __name__ == "__main__":
    load()
