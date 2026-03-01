"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2, ChevronDown, Compass } from "lucide-react";
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
    const pulse = selected
        ? `animation: marker-pulse 2s ease-in-out infinite;`
        : "";
    return L.divIcon({
        className: "",
        html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid ${border};
      box-shadow:0 0 ${selected ? "16px" : "6px"} ${color}80;
      transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer;
      ${pulse}
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
    const [legendCollapsed, setLegendCollapsed] = useState(false);
    const [mapReady, setMapReady] = useState(false);

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

            // Dark tile layer (CartoDB Dark Matter - No API Key Required)
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

            // Reveal with stagger
            setTimeout(() => setMapReady(true), 300);

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

    const sheetOpen = analyzing || !!analysis;

    return (
        <>
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
            <div
                className={`brand-badge ${mapReady ? "brand-badge--visible" : ""}`}
            >
                <div className="brand-badge__dot" />
                <span className="brand-badge__name">Anglap.ai</span>
                <span className="brand-badge__tagline">
                    Restaurant Intelligence
                </span>
            </div>

            {/* Search overlay */}
            <div className={`search-overlay ${mapReady ? "search-overlay--visible" : ""}`}>
                <div className="search-bar">
                    {analyzing ? (
                        <Loader2 size={16} color="#4fc3f7" className="search-spinner" />
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
                            className="search-clear-btn"
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
                className={`map-legend ${mapReady ? "map-legend--visible" : ""}`}
                style={{
                    bottom: sheetOpen ? "calc(66vh + 16px)" : 24,
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
                            transition: "transform 0.3s ease",
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
                <div className="restaurant-count">
                    <span className="restaurant-count__number">{restaurants.length}</span>
                    <span className="restaurant-count__label">restaurants loaded</span>
                </div>
            )}

            {/* Bottom sheet */}
            <BottomSheet
                analysis={analysis}
                loading={analyzing}
                onClose={handleClose}
            />

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes marker-pulse {
          0%, 100% { box-shadow: 0 0 12px currentColor; }
          50% { box-shadow: 0 0 24px currentColor; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .leaflet-tooltip-dark {
          background: rgba(17,17,17,0.95) !important;
          border: 1px solid #222 !important;
          color: #f0f0f0 !important;
          font-family: Inter, sans-serif !important;
          font-size: 12px !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6) !important;
          backdrop-filter: blur(8px) !important;
        }
        .leaflet-tooltip-dark::before { border-top-color: #222 !important; }

        /* Map overlay backdrop */
        .map-overlay-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 850;
          transition: opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1);
        }

        /* Brand badge */
        .brand-badge {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1001;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          background: rgba(8,8,8,0.92);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(79,195,247,0.15);
          border-radius: 40px;
          box-shadow: 0 0 24px rgba(79,195,247,0.08), 0 4px 16px rgba(0,0,0,0.4);
          opacity: 0;
          transform: translateY(-12px);
          transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }
        .brand-badge--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .brand-badge__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4fc3f7, #29b6f6);
          box-shadow: 0 0 10px #4fc3f7;
          animation: badge-glow 3s ease-in-out infinite;
        }
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 8px #4fc3f7; }
          50% { box-shadow: 0 0 16px #4fc3f7, 0 0 32px rgba(79,195,247,0.3); }
        }
        .brand-badge__name {
          font-size: 14px;
          font-weight: 700;
          color: #f0f0f0;
          letter-spacing: -0.3px;
        }
        .brand-badge__tagline {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 400;
          padding-left: 2px;
          border-left: 1px solid rgba(255,255,255,0.1);
          padding-left: 8px;
        }

        /* Search overlay entrance */
        .search-overlay--visible {
          animation: fadeInDown 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;
        }
        .search-spinner {
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }
        .search-clear-btn {
          background: rgba(255,255,255,0.06);
          border: none;
          cursor: pointer;
          color: #888;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .search-clear-btn:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }

        /* Legend */
        .map-legend {
          position: fixed;
          right: 20px;
          z-index: 1000;
          background: rgba(17,17,17,0.92);
          backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 12px;
          transition: bottom 0.4s cubic-bezier(0.32, 0.72, 0, 1),
                      opacity 0.4s ease, transform 0.4s ease;
          overflow: hidden;
          opacity: 0;
          transform: translateX(20px);
        }
        .map-legend--visible {
          opacity: 1;
          transform: translateX(0);
          animation: slideInRight 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
        }
        .legend-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }
        .legend-header:hover { background: rgba(255,255,255,0.03); }
        .legend-header__left {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .legend-body {
          padding: 0 14px 12px;
          animation: fadeInUp 0.2s ease-out;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }
        .legend-item:last-child { margin-bottom: 0; }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Restaurant count badge */
        .restaurant-count {
          position: fixed;
          bottom: 24px;
          left: 20px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(17,17,17,0.92);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 40px;
          animation: fadeInUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s both;
        }
        .restaurant-count__number {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
        }
        .restaurant-count__label {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .brand-badge__tagline { display: none; }
          .brand-badge { padding: 8px 14px; }
          .brand-badge__name { font-size: 13px; }
          .restaurant-count { display: none; }
        }
      `}</style>
        </>
    );
}
