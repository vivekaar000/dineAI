"""
Fetch Nashville tourist POIs from the Overpass API for local density calculations.
Saves to osm_pois.json.
"""
import json
import os
import urllib.request
import urllib.parse

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Query: All relevant tourist POIs in Nashville metro area
QUERY = """
[out:json][timeout:60];
(
  node["tourism"="hotel"](35.85,-87.05,36.45,-86.50);
  way["tourism"="hotel"](35.85,-87.05,36.45,-86.50);
  node["tourism"="attraction"](35.85,-87.05,36.45,-86.50);
  way["tourism"="attraction"](35.85,-87.05,36.45,-86.50);
  node["tourism"="museum"](35.85,-87.05,36.45,-86.50);
  way["tourism"="museum"](35.85,-87.05,36.45,-86.50);
  node["shop"="souvenir"](35.85,-87.05,36.45,-86.50);
  way["shop"="souvenir"](35.85,-87.05,36.45,-86.50);
  node["shop"="ticket"](35.85,-87.05,36.45,-86.50);
  way["shop"="ticket"](35.85,-87.05,36.45,-86.50);
);
out center body;
"""

def fetch_overpass():
    print("Fetching Nashville tourist POIs from Overpass API...")
    data = urllib.parse.urlencode({"data": QUERY}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data)
    req.add_header("User-Agent", "AuraAI-TouristScore/1.0")
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode())
    
    print(f"Received {len(result.get('elements', []))} POIs from Overpass")
    return result

def main():
    target = os.path.join(os.path.dirname(__file__), "osm_pois.json")
    result = fetch_overpass()
    
    with open(target, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"Saved POIs to {target}")

if __name__ == "__main__":
    main()
