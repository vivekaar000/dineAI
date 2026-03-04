"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2, ChevronDown, Compass, Sparkles } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import LiquidGlass from "@/components/LiquidGlass";
import DietaryFilters, { FILTERS } from "@/components/DietaryFilters";
import {
    fetchRestaurants,
    fetchOsmWithDietary,
    placesSearch,
    analyzeRestaurant,
    analyzeLivePlace,
    Restaurant,
    AnalysisResult,
} from "@/lib/api";
import { createBrowserClient } from '@supabase/ssr';

// Leaflet is browser-only — lazy import
type LeafletType = typeof import("leaflet");
let L: LeafletType;

function getMarkerColor(score?: number): string {
    if (score === undefined) return "#4fc3f7";
    if (score >= 65) return "#ef5350";
    if (score >= 40) return "#ffa726";
    return "#66bb6a";
}

function makeIcon(color: string, selected = false) {
    const size = selected ? 20 : 14;
    const border = selected ? "white" : "rgba(255,255,255,0.4)";
    const pulse = selected
        ? `animation: marker-pulse 2s ease-in-out infinite;`
        : "";
    const shadow = selected
        ? `0 0 18px ${color}88, 0 0 8px ${color}66`
        : `0 0 6px ${color}80`;
    return L.divIcon({
        className: "",
        html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2.5px solid ${border};
      box-shadow:${shadow};
      transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
      cursor:pointer;${pulse}
    "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

export default function MapPage() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
    const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
    const selectedKeyRef = useRef<string | null>(null);

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // AI Chat state
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAskingAI, setIsAskingAI] = useState(false);

    const [scores, setScores] = useState<Map<string, number>>(new Map());
    const [legendCollapsed, setLegendCollapsed] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    // Dietary filter state
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterMatchCount, setFilterMatchCount] = useState(0);

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setLegendCollapsed(true);
        }
    }, []);

    const [user, setUser] = useState<any>(null);
    const [tier, setTier] = useState<string>("free");

    // Helper to fetch tier — uses server-side API to bypass RLS
    const fetchTier = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`/api/user-tier?userId=${userId}`);
            if (res.ok) {
                const json = await res.json();
                if (json.tier) {
                    setTier(json.tier);
                    console.log("Tier loaded:", json.tier);
                }
            }
        } catch (err) {
            console.error("Tier fetch error:", err);
        }
    }, []);

    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Initial fetch
        const init = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                fetchTier(data.user.id);
            }
        };
        init();

        // Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                fetchTier(session.user.id);
            } else {
                setUser(null);
                setTier("free");
            }
        });

        // Re-fetch tier whenever the tab regains focus (catches Stripe redirect back)
        const handleFocus = () => {
            if (user?.id) fetchTier(user.id);
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("focus", handleFocus);
        };
    }, [fetchTier, user?.id]);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) return;

        const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number };
        if (container._leaflet_id) {
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
            markersRef.current.clear();
        }
        if (mapInstanceRef.current) return;

        import("leaflet").then((leaflet) => {
            L = leaflet.default;

            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!, {
                center: [36.1627, -86.7816],
                zoom: 14,
                zoomControl: true,
                attributionControl: true,
                // Mobile-friendly options
                touchZoom: true,
                bounceAtZoomLimits: false,
            });

            L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    maxZoom: 20,
                    subdomains: "abcd",
                }
            ).addTo(map);

            mapInstanceRef.current = map;

            // Staggered reveal
            setTimeout(() => setMapReady(true), 300);

            loadRestaurants(map, leaflet.default);
        });

        return () => {
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
            markersRef.current.clear();
        };
    }, []);

    const loadRestaurants = useCallback(async (map: import("leaflet").Map, leaflet: LeafletType) => {
        try {
            // Fetch backend DB
            const dbPromise = fetchRestaurants().catch(() => [] as Restaurant[]);
            // Fetch live OSM data with dietary tags via Overpass API
            const bounds = map.getBounds();
            const osmPromise = fetchOsmWithDietary(
                bounds.getSouth(),
                bounds.getWest(),
                bounds.getNorth(),
                bounds.getEast()
            ).catch(() =>
                // Fallback to static file if Overpass fails
                fetch("/nashville_restaurants.json").then(r => r.json()).catch(() => [] as Restaurant[])
            );

            const [dbData, osmData] = await Promise.all([dbPromise, osmPromise]);

            // Merge and deduplicate (favor DB data since it has real IDs and place_ids)
            const merged = new Map<string, Restaurant>();

            // Add OSM data first (now with dietary tags)
            osmData.forEach((r: any) => {
                if (!r.lat || !r.lng || !r.name || r.name === "Unknown") return;
                const dedupKey = `${r.name.toLowerCase().trim()}_${r.lat.toFixed(3)}_${r.lng.toFixed(3)}`;
                merged.set(dedupKey, {
                    ...r,
                    id: r.id || Math.floor(Math.random() * 1000000) + 10000,
                    is_osm: true
                });
            });

            // Add DB data, overwriting any matching OSM records (DB is ground truth)
            dbData.forEach((r: Restaurant) => {
                if (!r.lat || !r.lng) return;
                const dedupKey = `${r.name.toLowerCase().trim()}_${r.lat.toFixed(3)}_${r.lng.toFixed(3)}`;
                merged.set(dedupKey, r);
            });

            const finalData = Array.from(merged.values());
            setRestaurants(finalData);

            finalData.forEach((r) => {
                const isOsm = r.is_osm === true;
                const key = isOsm ? `osm-${r.id}` : `db-${r.id}`;
                const color = getMarkerColor(undefined); // Unanalyzed by default
                const marker = leaflet
                    .marker([r.lat, r.lng], { icon: makeIcon(color, false) })
                    .addTo(map)
                    .bindTooltip(r.name, {
                        className: "leaflet-tooltip-dark",
                        direction: "top",
                    })
                    .on("click", () => handleMarkerClick(r, key));

                markersRef.current.set(key, marker);
            });
        } catch {
            // Silently handle errors
        }
    }, []);

    const handleMarkerClick = useCallback(async (r: Restaurant, key: string) => {
        // Deselect previous
        if (selectedKeyRef.current && selectedKeyRef.current !== key) {
            const prev = markersRef.current.get(selectedKeyRef.current);
            const prevScore = scores.get(selectedKeyRef.current);
            prev?.setIcon(makeIcon(getMarkerColor(prevScore), false));
        }

        selectedKeyRef.current = key;
        const marker = markersRef.current.get(key);
        marker?.setIcon(makeIcon(getMarkerColor(scores.get(key)), true));

        mapInstanceRef.current?.panTo([r.lat, r.lng], { animate: true, duration: 0.5 });

        setAnalysis(null);
        setAnalysisError(null);
        setAnalyzing(true);

        // Enforce rate limiting based on tier
        let currentTier = tier;

        // If tier is still "free", double-check with server (handles async race)
        if (currentTier === "free" && user?.id) {
            try {
                const res = await fetch(`/api/user-tier?userId=${user.id}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.tier) {
                        currentTier = json.tier;
                        setTier(json.tier);
                    }
                }
            } catch { /* proceed with cached tier */ }
        }

        if (currentTier === "free" || !user) {
            const today = new Date().toDateString();
            const storedDate = localStorage.getItem("praxisloci_search_date");
            let count = 0;
            if (storedDate === today) {
                count = parseInt(localStorage.getItem("praxisloci_search_count") || "0");
            } else {
                localStorage.setItem("praxisloci_search_date", today);
            }
            if (count >= 3) {
                setAnalysisError("Daily limit of 3 AI Searches reached on the Free tier. Upgrade to Local Insider to unlock unlimited AI analysis & premium signals.");
                setAnalyzing(false);
                return;
            }
            localStorage.setItem("praxisloci_search_count", (count + 1).toString());
        }

        try {
            let result: AnalysisResult;

            if (r.place_id) {
                // Already has a Google Place ID
                result = await analyzeLivePlace(r.place_id);
            } else if (r.id && !key.startsWith("osm-")) {
                // Real DB restaurant
                result = await analyzeRestaurant(r.id);
            } else if (key.startsWith("osm-")) {
                // OSM Restaurant: Doesn't have place_id yet! We must search it in Places to get it.
                const { placesSearch } = await import("@/lib/api");
                const q = `${r.name} ${r.city || "Nashville"}`;
                const searchResults = await placesSearch(q);

                if (searchResults && searchResults.length > 0 && searchResults[0].place_id) {
                    result = await analyzeLivePlace(searchResults[0].place_id);
                } else {
                    console.warn("Could not find live Places match for OSM restaurant:", r.name);
                    setAnalysisError(`Could not find a Google Places match for "${r.name}".`);
                    return;
                }
            } else {
                setAnalysisError("Invalid restaurant data.");
                return;
            }

            setAnalysis(result);

            const score = result.tts_score;
            setScores((prev) => new Map(prev).set(key, score));
            marker?.setIcon(makeIcon(getMarkerColor(score), true));
        } catch (e) {
            console.error("Analysis error:", e);
            setAnalysisError("Failed to fetch intelligence data. The server might be experiencing high load or returned an error.");
        } finally {
            setAnalyzing(false);
        }
    }, [scores, tier]);

    const handleAskAI = async () => {
        if (!searchQuery.trim() || isAskingAI) return;
        setIsAskingAI(true);
        setAiResponse(null);
        setShowResults(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery, restaurants })
            });
            const data = await res.json();
            if (data.text) {
                setAiResponse(data.text);
            } else {
                setAiResponse(data.error || "Failed to get AI response.");
            }
        } catch (e) {
            console.error("Ask AI error:", e);
            setAiResponse("An error occurred while contacting the AI.");
        } finally {
            setIsAskingAI(false);
        }
    };

    // Search debounce with local + fallback API
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const t = setTimeout(async () => {
            const query = searchQuery.toLowerCase().trim();

            // 1. Instant local search (checks all 1600+ pins on the map first)
            const localHits = restaurants.filter(
                r => r.name.toLowerCase().includes(query) ||
                    (r.cuisine && r.cuisine.toLowerCase().includes(query))
            ).slice(0, 8); // Top 8 local hits

            if (localHits.length > 0) {
                setSearchResults(localHits);
                setShowResults(true);
                return; // Resolve instantly without network calls
            }

            // 2. Fallback to live Places search if not found locally
            try {
                const results = await placesSearch(searchQuery);
                if (results && results.length > 0) {
                    setSearchResults(results);
                    setShowResults(true);
                    return;
                }
            } catch {
                // Places API failed
            }

            // 3. Fallback to backend DB
            try {
                const { searchRestaurants } = await import("@/lib/api");
                const dbResults = await searchRestaurants(searchQuery);
                if (dbResults && dbResults.length > 0) {
                    setSearchResults(dbResults);
                    setShowResults(true);
                    return;
                }
            } catch {
                // DB search also failed
            }

            setSearchResults([]);
            setShowResults(false);
        }, 300); // reduced debounce from 400 for faster local response

        return () => clearTimeout(t);
    }, [searchQuery, restaurants]);

    // -- Dietary filter logic: show/hide markers based on active filters --
    const matchesFilters = useCallback((r: Restaurant, filters: Set<string>): boolean => {
        if (filters.size === 0) return true;
        const filterIds = Array.from(filters);

        // Check real OSM dietary boolean fields first, then fall back to keyword matching
        for (const filterId of filterIds) {
            // Direct boolean field match from OSM data
            switch (filterId) {
                case "vegan":
                    if (r.diet_vegan) return true;
                    break;
                case "vegetarian":
                    if (r.diet_vegetarian) return true;
                    break;
                case "halal":
                    if (r.diet_halal) return true;
                    break;
                case "kosher":
                    if (r.diet_kosher) return true;
                    break;
                case "gluten_free":
                    if (r.diet_gluten_free) return true;
                    break;
                case "organic":
                    if (r.organic) return true;
                    break;
            }

            // Keyword fallback for cuisine text matching (seafood, asian, latin, mediterranean, etc.)
            const filter = FILTERS.find(f => f.id === filterId);
            if (!filter) continue;
            const text = `${r.name} ${r.cuisine || ""}`.toLowerCase();
            if (filter.keywords.some(kw => text.includes(kw))) {
                return true;
            }
        }
        return false;
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current) return;
        let count = 0;

        restaurants.forEach((r) => {
            const isOsm = r.is_osm === true;
            const key = isOsm ? `osm-${r.id}` : `db-${r.id}`;
            const marker = markersRef.current.get(key);
            if (!marker) return;

            const visible = matchesFilters(r, activeFilters);
            if (visible) {
                if (!mapInstanceRef.current!.hasLayer(marker)) {
                    marker.addTo(mapInstanceRef.current!);
                }
                marker.setOpacity(1);
                count++;
            } else {
                if (mapInstanceRef.current!.hasLayer(marker)) {
                    mapInstanceRef.current!.removeLayer(marker);
                }
            }
        });

        setFilterMatchCount(activeFilters.size === 0 ? restaurants.length : count);
    }, [activeFilters, restaurants, matchesFilters]);

    const handleToggleFilter = useCallback((filterId: string) => {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(filterId)) {
                next.delete(filterId);
            } else {
                next.add(filterId);
            }
            return next;
        });
    }, []);

    const handleClearFilters = useCallback(() => {
        setActiveFilters(new Set());
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showResults) {
                    setShowResults(false);
                } else if (analysis || analyzing) {
                    handleClose();
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [showResults, analysis, analyzing]);

    const handleSelectResult = (r: Restaurant) => {
        setSearchQuery(r.name);
        setShowResults(false);

        if (!r.lat || !r.lng || !mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        map.flyTo([r.lat, r.lng], 16, { animate: true, duration: 1.2 });

        const key = r.place_id ? `places-${r.place_id}` : `db-${r.id}`;
        if (markersRef.current.has(key)) {
            handleMarkerClick(r, key);
            return;
        }

        import("leaflet").then(({ default: leaflet }) => {
            const marker = leaflet
                .marker([r.lat, r.lng], { icon: makeIcon("#4fc3f7", true) })
                .addTo(map)
                .bindTooltip(r.name, { direction: "top", className: "leaflet-tooltip-dark" })
                .on("click", () => handleMarkerClick(r, key));

            markersRef.current.set(key, marker);
            handleMarkerClick(r, key);
        });
    };

    const handleClose = () => {
        setAnalysis(null);
        setAnalysisError(null);
        setAnalyzing(false);
        if (selectedKeyRef.current) {
            const marker = markersRef.current.get(selectedKeyRef.current);
            const score = scores.get(selectedKeyRef.current);
            marker?.setIcon(makeIcon(getMarkerColor(score), false));
            selectedKeyRef.current = null;
        }
    };

    const sheetOpen = analyzing || !!analysis;

    return (
        <>
            {/* Viewport meta for mobile */}
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="theme-color" content="#080808" />

            {/* Leaflet CSS */}
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />

            {/* Map */}
            <div id="map-root" ref={mapRef} />

            {/* Dim overlay when sheet is open */}
            <div
                className="map-overlay-backdrop"
                style={{ opacity: sheetOpen ? 1 : 0, pointerEvents: sheetOpen ? "auto" : "none" }}
                onClick={handleClose}
            />

            {/* Brand badge */}
            <LiquidGlass tiltMax={8} glareOpacity={0.12}>
                <div className={`brand-badge ${mapReady ? "brand-badge--visible" : ""}`}>
                    <div className="brand-badge__dot" />
                    <span className="brand-badge__name">Praxis AI</span>
                    <span className="brand-badge__tagline">Restaurant Intelligence</span>
                </div>
            </LiquidGlass>

            {/* Top Navigation */}
            <div className={`top-nav ${mapReady ? "top-nav--visible" : ""}`}>
                <LiquidGlass tiltMax={15} glareOpacity={0.2}>
                    <a href="/about">About</a>
                </LiquidGlass>
                <LiquidGlass tiltMax={15} glareOpacity={0.2}>
                    <a href="/pricing">Pricing</a>
                </LiquidGlass>
                {user ? (
                    <>
                        {tier !== "free" && (
                            <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                background: tier === "premium" ? "rgba(139, 92, 246, 0.2)" : "rgba(79, 195, 247, 0.2)",
                                color: tier === "premium" ? "#a78bfa" : "#4fc3f7",
                                border: `1px solid ${tier === "premium" ? "rgba(139, 92, 246, 0.3)" : "rgba(79, 195, 247, 0.3)"}`,
                            }}>
                                {tier === "premium" ? "Analyst" : "Insider"}
                            </span>
                        )}
                        <LiquidGlass tiltMax={15} glareOpacity={0.25}>
                            <a href="/dashboard" className="nav-primary">Dashboard</a>
                        </LiquidGlass>
                    </>
                ) : (
                    <>
                        <LiquidGlass tiltMax={15} glareOpacity={0.2}>
                            <a href="/login?tab=signin">Sign In</a>
                        </LiquidGlass>
                        <LiquidGlass tiltMax={15} glareOpacity={0.25}>
                            <a href="/login?tab=signup" className="nav-primary">Sign Up</a>
                        </LiquidGlass>
                    </>
                )}
            </div>

            {/* Search overlay */}
            <div className={`search-overlay ${mapReady ? "search-overlay--visible" : ""}`}>
                <div style={{ display: "flex", gap: "8px" }}>
                    <div className="search-bar" style={{ flex: 1 }}>
                        {analyzing ? (
                            <Loader2 size={16} color="#4fc3f7" className="search-spinner" />
                        ) : (
                            <Search size={16} color="#555" style={{ flexShrink: 0 }} />
                        )}
                        <input
                            type="text"
                            placeholder="Search any restaurant or ask AI…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleAskAI();
                                }
                            }}
                            enterKeyHint="search"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                        {searchQuery && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <button
                                    onClick={handleAskAI}
                                    title="Ask Praxis Loci"
                                    disabled={isAskingAI}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#a855f7",
                                        cursor: "pointer",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    {isAskingAI ? <Loader2 size={16} className="search-spinner" color="#a855f7" /> : <Sparkles size={16} />}
                                </button>
                                <div style={{ width: 1, height: 16, background: "var(--border)" }} />
                                <button
                                    onClick={() => { setSearchQuery(""); setShowResults(false); setSearchResults([]); setAiResponse(null); }}
                                    className="search-clear-btn"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Advanced Dietary Filters Button */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <LiquidGlass tiltMax={12} glareOpacity={0.2}>
                            <button
                                onClick={() => {
                                    if (tier === "free") {
                                        window.location.href = "/pricing";
                                    } else {
                                        setFiltersOpen(!filtersOpen);
                                    }
                                }}
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "14px",
                                    background: activeFilters.size > 0 ? "rgba(79, 195, 247, 0.12)" : "var(--glass-bg)",
                                    backgroundImage: "var(--glass-shine)",
                                    border: activeFilters.size > 0 ? "1px solid rgba(79, 195, 247, 0.3)" : "1px solid var(--glass-border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: activeFilters.size > 0 ? "#4fc3f7" : "white",
                                    cursor: "pointer",
                                    backdropFilter: "var(--glass-blur)",
                                    WebkitBackdropFilter: "var(--glass-blur)",
                                    pointerEvents: "auto",
                                    transition: "all 0.3s ease",
                                    boxShadow: activeFilters.size > 0
                                        ? "0 0 16px rgba(79, 195, 247, 0.1), inset 0 1px 0 rgba(255,255,255,0.08)"
                                        : "inset 0 1px 0 rgba(255,255,255,0.04)",
                                }}
                                title="Dietary Filters"
                            >
                                <div style={{ position: "relative" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                    {tier === "free" && <span style={{ position: "absolute", top: -8, right: -10, fontSize: "14px", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>🔒</span>}
                                    {activeFilters.size > 0 && tier !== "free" && (
                                        <span style={{
                                            position: "absolute",
                                            top: -8,
                                            right: -10,
                                            background: "#4fc3f7",
                                            color: "#000",
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            width: "16px",
                                            height: "16px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>{activeFilters.size}</span>
                                    )}
                                </div>
                            </button>
                        </LiquidGlass>

                        <DietaryFilters
                            isOpen={filtersOpen}
                            onClose={() => setFiltersOpen(false)}
                            activeFilters={activeFilters}
                            onToggleFilter={handleToggleFilter}
                            onClearAll={handleClearFilters}
                            matchCount={filterMatchCount}
                        />
                    </div>
                </div>

                {(showResults && (searchResults.length > 0 || isAskingAI || aiResponse || searchQuery)) && (
                    <div className="search-results">
                        {(isAskingAI || aiResponse) && (
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "rgba(168, 85, 247, 0.05)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#a855f7", fontWeight: 600, fontSize: "13px" }}>
                                    <Sparkles size={14} /> Praxis Loci Assistant
                                </div>
                                {isAskingAI ? (
                                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Thinking...</div>
                                ) : (
                                    <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                                        {aiResponse}
                                    </div>
                                )}
                            </div>
                        )}

                        {searchResults.map((r, i) => (
                            <div
                                key={r.place_id || r.id || i}
                                className="search-result-item"
                                onClick={() => handleSelectResult(r)}
                            >
                                <MapPin size={14} color="#555" style={{ flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                    <div className="result-name">{r.name}</div>
                                    <div className="result-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {r.address || r.city}
                                        {r.google_rating && ` · ⭐ ${r.google_rating}`}
                                        {r.price_level != null &&
                                            ` · ${"$".repeat(r.price_level + 1)}`}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isAskingAI && !aiResponse && searchResults.length === 0 && searchQuery && (
                            <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                                No restaurants found. Try asking the AI!
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div
                className={`map-legend ${mapReady ? "map-legend--visible" : ""}`}
                style={{
                    bottom: sheetOpen ? "calc(72vh + 12px)" : `calc(24px + var(--safe-bottom, 0px))`,
                }}
            >
                <div
                    className="legend-header"
                    onClick={() => setLegendCollapsed(!legendCollapsed)}
                >
                    <div className="legend-header__left">
                        <Compass size={12} color="var(--accent)" />
                        <span>Tourist Score</span>
                    </div>
                    <ChevronDown
                        size={12}
                        color="var(--text-muted)"
                        style={{
                            transform: legendCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                        }}
                    />
                </div>
                {!legendCollapsed && (
                    <div className="legend-body">
                        {[
                            { color: "#66bb6a", label: "Local (0–40)" },
                            { color: "#ffa726", label: "Mixed (41–64)" },
                            { color: "#ef5350", label: "Visitor-Oriented (65+)" },
                            { color: "#4fc3f7", label: "Not analyzed" },
                        ].map(({ color, label }) => (
                            <div key={label} className="legend-item">
                                <div
                                    className="legend-dot"
                                    style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
                                />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Restaurant count badge */}
            {mapReady && restaurants.length > 0 && (
                <div
                    className="restaurant-count"
                    style={{
                        bottom: sheetOpen ? `calc(72vh + 12px)` : `calc(24px + var(--safe-bottom, 0px))`,
                    }}
                >
                    <span className="restaurant-count__number">{restaurants.length}</span>
                    <span className="restaurant-count__label">restaurants loaded</span>
                </div>
            )}

            {/* Bottom sheet */}
            <BottomSheet
                analysis={analysis}
                loading={analyzing}
                error={analysisError}
                onClose={handleClose}
                tier={tier}
            />
        </>
    );
}
