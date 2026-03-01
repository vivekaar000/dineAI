"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import {
    fetchRestaurants,
    placesSearch,
    analyzeRestaurant,
    analyzeLivePlace,
    Restaurant,
    AnalysisResult,
} from "@/lib/api";

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
    const size = selected ? 18 : 12;
    const border = selected ? "white" : "rgba(255,255,255,0.4)";
    return L.divIcon({
        className: "",
        html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid ${border};
      box-shadow:0 0 ${selected ? "12px" : "4px"} ${color}80;
      transition:all 0.2s;cursor:pointer;
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
    const [analyzing, setAnalyzing] = useState(false);
    const [scores, setScores] = useState<Map<string, number>>(new Map());

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) return;

        // Guard: if container already has a Leaflet map, remove it first
        const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number };
        if (container._leaflet_id) {
            mapInstanceRef.current?.remove();
            mapInstanceRef.current = null;
            markersRef.current.clear();
        }
        if (mapInstanceRef.current) return;

        import("leaflet").then((leaflet) => {
            L = leaflet.default;

            // Fix missing marker icons
            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!, {
                center: [36.1627, -86.7816], // Nashville downtown
                zoom: 14,
                zoomControl: true,
                attributionControl: true,
            });

            // Dark tile layer (Stadia Alidade Smooth Dark)
            L.tileLayer(
                "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
                {
                    attribution:
                        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 19,
                }
            ).addTo(map);

            mapInstanceRef.current = map;

            // Load seed restaurants
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
            const data = await fetchRestaurants();
            setRestaurants(data);

            data.forEach((r) => {
                if (!r.lat || !r.lng) return;
                const key = `db-${r.id}`;
                const color = getMarkerColor(undefined);
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
            // Backend may not be running yet
        }
    }, []);

    const handleMarkerClick = useCallback(async (r: Restaurant, key: string) => {
        // Deselect previous
        if (selectedKeyRef.current && selectedKeyRef.current !== key) {
            const prev = markersRef.current.get(selectedKeyRef.current);
            const prevScore = scores.get(selectedKeyRef.current);
            prev?.setIcon(makeIcon(getMarkerColor(prevScore), false));
        }

        // Select this one
        selectedKeyRef.current = key;
        const marker = markersRef.current.get(key);
        marker?.setIcon(makeIcon(getMarkerColor(scores.get(key)), true));

        // Pan to marker
        mapInstanceRef.current?.panTo([r.lat, r.lng], { animate: true });

        setAnalysis(null);
        setAnalyzing(true);

        try {
            let result: AnalysisResult;
            if (r.place_id) {
                result = await analyzeLivePlace(r.place_id);
            } else if (r.id) {
                result = await analyzeRestaurant(r.id);
            } else {
                return;
            }

            setAnalysis(result);

            // Update marker color with score
            const score = result.tts_score;
            setScores((prev) => new Map(prev).set(key, score));
            marker?.setIcon(makeIcon(getMarkerColor(score), true));
        } finally {
            setAnalyzing(false);
        }
    }, [scores]);

    // Search debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const t = setTimeout(async () => {
            try {
                // Try live Places search first
                const results = await placesSearch(searchQuery);
                setSearchResults(results);
                setShowResults(true);
            } catch {
                setSearchResults([]);
            }
        }, 400);

        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleSelectResult = (r: Restaurant) => {
        setSearchQuery(r.name);
        setShowResults(false);

        if (!r.lat || !r.lng || !mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        map.flyTo([r.lat, r.lng], 16, { animate: true, duration: 1.2 });

        // If this place is already a marker, click it
        const key = r.place_id ? `places-${r.place_id}` : `db-${r.id}`;
        if (markersRef.current.has(key)) {
            handleMarkerClick(r, key);
            return;
        }

        // Add temporary marker for the Places result
        import("leaflet").then(({ default: leaflet }) => {
            const marker = leaflet
                .marker([r.lat, r.lng], { icon: makeIcon("#4fc3f7", true) })
                .addTo(map)
                .bindTooltip(r.name, { direction: "top" })
                .on("click", () => handleMarkerClick(r, key));

            markersRef.current.set(key, marker);
            handleMarkerClick(r, key);
        });
    };

    const handleClose = () => {
        setAnalysis(null);
        setAnalyzing(false);
        if (selectedKeyRef.current) {
            const marker = markersRef.current.get(selectedKeyRef.current);
            const score = scores.get(selectedKeyRef.current);
            marker?.setIcon(makeIcon(getMarkerColor(score), false));
            selectedKeyRef.current = null;
        }
    };

    return (
        <>
            {/* Leaflet CSS */}
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />

            {/* Map */}
            <div id="map-root" ref={mapRef} />

            {/* Brand badge */}
            <div
                style={{
                    position: "fixed",
                    top: 20,
                    left: 20,
                    zIndex: 1001,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: "rgba(8,8,8,0.88)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(79,195,247,0.2)",
                    borderRadius: 40,
                    boxShadow: "0 0 20px rgba(79,195,247,0.1)",
                }}
            >
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#4fc3f7",
                        boxShadow: "0 0 8px #4fc3f7",
                    }}
                />
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#f0f0f0",
                        letterSpacing: "-0.2px",
                    }}
                >
                    Aura.ai
                </span>
                <span
                    style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontWeight: 400,
                    }}
                >
                    Restaurant Intelligence
                </span>
            </div>

            {/* Search overlay */}
            <div className="search-overlay">
                <div className="search-bar">
                    {analyzing ? (
                        <Loader2 size={16} color="#4fc3f7" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                    ) : (
                        <Search size={16} color="#555" style={{ flexShrink: 0 }} />
                    )}
                    <input
                        type="text"
                        placeholder="Search any restaurant…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(""); setShowResults(false); setSearchResults([]); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", alignItems: "center" }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {showResults && searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map((r, i) => (
                            <div
                                key={r.place_id || r.id || i}
                                className="search-result-item"
                                onClick={() => handleSelectResult(r)}
                            >
                                <MapPin size={14} color="#555" style={{ flexShrink: 0 }} />
                                <div>
                                    <div className="result-name">{r.name}</div>
                                    <div className="result-meta">
                                        {r.address || r.city}
                                        {r.google_rating && ` · ⭐ ${r.google_rating}`}
                                        {r.price_level != null &&
                                            ` · ${"$".repeat(r.price_level + 1)}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div
                style={{
                    position: "fixed",
                    bottom: analyzing || analysis ? "calc(66vh + 16px)" : 24,
                    right: 20,
                    zIndex: 1000,
                    background: "rgba(17,17,17,0.9)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    fontSize: 12,
                    transition: "bottom 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
            >
                <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Tourist Score
                </div>
                {[
                    { color: "#66bb6a", label: "Local (0–40)" },
                    { color: "#ffa726", label: "Mixed (41–64)" },
                    { color: "#ef5350", label: "Visitor-Oriented (65+)" },
                    { color: "#4fc3f7", label: "Not analyzed" },
                ].map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}80` }} />
                        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Bottom sheet */}
            <BottomSheet
                analysis={analysis}
                loading={analyzing}
                onClose={handleClose}
            />

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-tooltip-dark {
          background: rgba(17,17,17,0.95) !important;
          border: 1px solid #222 !important;
          color: #f0f0f0 !important;
          font-family: Inter, sans-serif !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          padding: 4px 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
        }
        .leaflet-tooltip-dark::before { border-top-color: #222 !important; }
      `}</style>
        </>
    );
}
