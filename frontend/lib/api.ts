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

// ──── Local data cache ────
// Stores pre-computed restaurant data + scores from the static JSON.
// Eliminates API calls for known restaurants.
let _localCache: (Restaurant & { tts_score?: number; local_authenticity_score?: number; signals?: any; predicted_label?: string })[] | null = null;
type CacheType = (Restaurant & { tts_score?: number; local_authenticity_score?: number; signals?: any; predicted_label?: string })[];
let _cachePromise: Promise<CacheType> | null = null;

// Index for instant lookups by id and by lat/lng key
let _idIndex: Map<number, any> | null = null;
let _placeIdIndex: Map<string, any> | null = null;

function _buildIndexes() {
    if (!_localCache) return;
    _idIndex = new Map();
    _placeIdIndex = new Map();
    for (const r of _localCache) {
        if (r.id) _idIndex.set(r.id, r);
        if ((r as any).place_id) _placeIdIndex.set((r as any).place_id, r);
    }
}

// Start fetching IMMEDIATELY on module load — don't wait for first call
_cachePromise = (async () => {
    try {
        const res = await fetch("/nashville_restaurants.json");
        if (res.ok) {
            _localCache = await res.json();
            _buildIndexes();
        }
    } catch {
        _localCache = [];
    }
    return _localCache || [];
})();

async function getLocalCache() {
    if (_localCache) return _localCache;
    return (await _cachePromise) || [];
}

// Instant (synchronous) score lookup for marker coloring — returns undefined if cache not ready
export function getCachedRestaurantScore(id: number): number | undefined {
    if (!_idIndex) return undefined;
    const r = _idIndex.get(id);
    return r?.tts_score;
}

// Instant pre-computed analysis lookup — returns null if not found or not cached
export function getPrecomputedAnalysis(id?: number, placeId?: string): AnalysisResult | null {
    if (!_localCache) return null;
    let rec: any = null;
    if (id && _idIndex) rec = _idIndex.get(id);
    if (!rec && placeId && _placeIdIndex) rec = _placeIdIndex.get(placeId);
    return localToAnalysis(rec);
}

// Find a restaurant in local cache by ID
function findLocalById(cache: any[], id: number) {
    return cache.find((r: any) => r.id === id);
}

// Find a restaurant in local cache by place_id
function findLocalByPlaceId(cache: any[], placeId: string) {
    return cache.find((r: any) => r.place_id === placeId);
}

// Convert a local cache record into an AnalysisResult
function localToAnalysis(rec: any): AnalysisResult | null {
    if (!rec || !rec.tts_score) return null;
    return {
        restaurant: {
            id: rec.id,
            name: rec.name,
            cuisine: rec.cuisine,
            city: rec.city,
            lat: rec.lat,
            lng: rec.lng,
            avg_price: rec.avg_price,
            address: rec.address,
            place_id: rec.place_id,
        },
        tts_score: rec.tts_score,
        local_authenticity_score: rec.local_authenticity_score,
        predicted_label: rec.predicted_label || (rec.tts_score >= 65 ? "tourist" : rec.tts_score >= 40 ? "mixed" : "local"),
        signals: rec.signals || {
            review_linguistics: { score: 50, label: "Review Linguistics" },
            tourist_density: { score: 50, label: "Tourist Density" },
            price_inflation: { score: 50, label: "Price Inflation" },
            menu_engineering: { score: 50, label: "Menu Engineering" },
            repeat_local: { score: 50, label: "Repeat Local Proxy" },
            attraction_proximity: { score: 50, label: "Attraction Proximity" },
        },
        cached: true,
    };
}

// ──── API functions (local-first, API fallback) ────

// Fetch all restaurants — uses static JSON, no backend needed
export async function fetchRestaurants(city?: string): Promise<Restaurant[]> {
    const cache = await getLocalCache();
    if (cache.length > 0) {
        if (city) {
            return cache.filter((r: any) => r.city?.toLowerCase().includes(city.toLowerCase()));
        }
        return cache;
    }
    // Fallback to backend API
    const url = city
        ? `${API_URL}/api/restaurants?city=${encodeURIComponent(city)}`
        : `${API_URL}/api/restaurants`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch restaurants");
    return res.json();
}

// Search restaurants — local first, then backend
export async function searchRestaurants(q: string): Promise<Restaurant[]> {
    const cache = await getLocalCache();
    const query = q.toLowerCase().trim();
    const localHits = cache.filter((r: any) =>
        r.name?.toLowerCase().includes(query) ||
        r.cuisine?.toLowerCase().includes(query) ||
        r.address?.toLowerCase().includes(query)
    ).slice(0, 10);
    if (localHits.length > 0) return localHits;

    // Fallback to backend
    const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
}

// Analyze a DB restaurant — check local cache first
export async function analyzeRestaurant(id: number): Promise<AnalysisResult> {
    const cache = await getLocalCache();
    const local = findLocalById(cache, id);
    const localResult = localToAnalysis(local);
    if (localResult) return localResult;

    // Fallback to backend API
    const res = await fetch(`${API_URL}/api/analyze/${id}`);
    if (!res.ok) throw new Error("Analysis failed");
    return res.json();
}

// Live Google Places search (still needs API — no local equivalent for arbitrary searches)
export async function placesSearch(q: string): Promise<Restaurant[]> {
    // First try local search
    const cache = await getLocalCache();
    const query = q.toLowerCase().trim();
    const localHits = cache.filter((r: any) =>
        r.name?.toLowerCase().includes(query)
    ).slice(0, 10);
    if (localHits.length > 0) return localHits;

    // Fallback to live Places API
    const res = await fetch(`${API_URL}/api/places/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("Places search failed");
    return res.json();
}

// Analyze a live Place — check local cache by place_id first
export async function analyzeLivePlace(placeId: string): Promise<AnalysisResult> {
    const cache = await getLocalCache();
    const local = findLocalByPlaceId(cache, placeId);
    const localResult = localToAnalysis(local);
    if (localResult) return localResult;

    // Fallback to backend API (only for truly new restaurants)
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
