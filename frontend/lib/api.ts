const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Restaurant {
    id?: number;
    place_id?: string;
    name: string;
    cuisine?: string;
    city?: string;
    lat: number;
    lng: number;
    avg_price?: number;
    address?: string;
    google_rating?: number;
    price_level?: number;
    is_osm?: boolean;
    // Dietary tags from OSM
    diet_vegan?: boolean;
    diet_vegetarian?: boolean;
    diet_halal?: boolean;
    diet_kosher?: boolean;
    diet_gluten_free?: boolean;
    diet_lactose_free?: boolean;
    diet_dairy_free?: boolean;
    organic?: boolean;
}

export interface SignalScore {
    score: number;
    label: string;
    inflation_pct?: number;
    nearest_attraction?: string;
    distance_m?: number;
}

export interface AnalysisResult {
    restaurant: Restaurant;
    tts_score: number;
    local_authenticity_score: number;
    predicted_label: "local" | "mixed" | "tourist";
    gemini_reasoning?: string;
    signals: {
        review_linguistics: SignalScore;
        tourist_density: SignalScore;
        price_inflation: SignalScore;
        menu_engineering: SignalScore;
        repeat_local: SignalScore;
        attraction_proximity: SignalScore;
    };
    weights?: Record<string, number>;
    cached?: boolean;
    geo_data?: Record<string, number>;
}

export interface ValidationStats {
    total_samples: number;
    accuracy: number | null;
    confusion_matrix: number[][] | null;
    confusion_labels: string[];
    precision: Record<string, number> | null;
}

// Seed DB restaurants
export async function fetchRestaurants(city?: string): Promise<Restaurant[]> {
    const url = city
        ? `${API_URL}/api/restaurants?city=${encodeURIComponent(city)}`
        : `${API_URL}/api/restaurants`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch restaurants");
    return res.json();
}

// Database search by name
export async function searchRestaurants(q: string): Promise<Restaurant[]> {
    const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
}

// Analyze a DB restaurant
export async function analyzeRestaurant(id: number): Promise<AnalysisResult> {
    const res = await fetch(`${API_URL}/api/analyze/${id}`);
    if (!res.ok) throw new Error("Analysis failed");
    return res.json();
}

// Live Google Places search
export async function placesSearch(q: string): Promise<Restaurant[]> {
    const res = await fetch(`${API_URL}/api/places/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("Places search failed");
    return res.json();
}

// Live Google Places full analysis
export async function analyzeLivePlace(placeId: string): Promise<AnalysisResult> {
    const res = await fetch(`${API_URL}/api/places/analyze-live/${placeId}`);
    if (!res.ok) throw new Error("Live analysis failed");
    return res.json();
}

// Submit validation label
export async function submitValidation(
    restaurantId: number,
    trueLabel: "local" | "mixed" | "tourist"
) {
    const res = await fetch(`${API_URL}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, true_label: trueLabel }),
    });
    if (!res.ok) throw new Error("Validation failed");
    return res.json();
}

// Get validation stats
export async function getValidationStats(): Promise<ValidationStats> {
    const res = await fetch(`${API_URL}/api/validate/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

// Fetch restaurants with dietary data from OpenStreetMap Overpass API
export async function fetchOsmWithDietary(
    south: number,
    west: number,
    north: number,
    east: number
): Promise<Restaurant[]> {
    const bbox = `${south},${west},${north},${east}`;
    const query = `
[out:json][timeout:25];
(
  node["amenity"="restaurant"](${bbox});
  node["amenity"="cafe"](${bbox});
  node["amenity"="fast_food"](${bbox});
);
out body;
`.trim();

    const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) throw new Error("Overpass API failed");
    const data = await res.json();

    return (data.elements || []).map((el: any) => {
        const tags = el.tags || {};
        const yesOrOnly = (v?: string) => v === "yes" || v === "only";
        return {
            id: el.id,
            name: tags.name || "Unknown",
            cuisine: tags.cuisine || "",
            lat: el.lat,
            lng: el.lon,
            address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || undefined,
            is_osm: true,
            diet_vegan: yesOrOnly(tags["diet:vegan"]),
            diet_vegetarian: yesOrOnly(tags["diet:vegetarian"]),
            diet_halal: yesOrOnly(tags["diet:halal"]),
            diet_kosher: yesOrOnly(tags["diet:kosher"]),
            diet_gluten_free: yesOrOnly(tags["diet:gluten_free"]),
            diet_lactose_free: yesOrOnly(tags["diet:lactose_free"]),
            diet_dairy_free: yesOrOnly(tags["diet:dairy_free"]),
            organic: yesOrOnly(tags.organic),
        } as Restaurant;
    });
}
