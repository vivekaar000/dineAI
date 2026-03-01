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
