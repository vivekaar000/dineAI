"""
Fetch ALL Nashville restaurants from the Overpass API and save to osm_nashville.json.
This replaces the manually curated subset with the complete dataset.
"""
import json
import os
import urllib.request
import urllib.parse

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Query: All restaurants in Nashville metro area
QUERY = """
[out:json][timeout:60];
area["name"="Nashville"]["admin_level"="6"]->.city;
(
  node["amenity"="restaurant"](area.city);
  way["amenity"="restaurant"](area.city);
  node["amenity"="restaurant"](35.85,-87.05,36.45,-86.50);
  way["amenity"="restaurant"](35.85,-87.05,36.45,-86.50);
);
out center body;
"""

def fetch_overpass():
    """Fetch Nashville restaurants from Overpass API."""
    print("Fetching Nashville restaurants from Overpass API...")
    data = urllib.parse.urlencode({"data": QUERY}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data)
    req.add_header("User-Agent", "AuraAI-TouristScore/1.0")
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode())
    
    print(f"Received {len(result.get('elements', []))} elements from Overpass")
    return result

def main():
    target = os.path.join(os.path.dirname(__file__), "osm_nashville.json")
    
    result = fetch_overpass()
    
    with open(target, "w") as f:
        json.dump(result, f, indent=2)
    
    # Count named restaurants
    named = [e for e in result.get("elements", []) if e.get("tags", {}).get("name")]
    print(f"Saved {len(named)} named restaurants to {target}")

if __name__ == "__main__":
    main()
