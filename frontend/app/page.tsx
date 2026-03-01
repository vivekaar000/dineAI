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
    const [analyzing, setAnalyzing] = useState(false);
    const [scores, setScores] = useState<Map<string, number>>(new Map());
    const [legendCollapsed, setLegendCollapsed] = useState(false);
    const [mapReady, setMapReady] = useState(false);

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

        selectedKeyRef.current = key;
        const marker = markersRef.current.get(key);
        marker?.setIcon(makeIcon(getMarkerColor(scores.get(key)), true));

        mapInstanceRef.current?.panTo([r.lat, r.lng], { animate: true, duration: 0.5 });

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
            <div className={`brand-badge ${mapReady ? "brand-badge--visible" : ""}`}>
                <div className="brand-badge__dot" />
                <span className="brand-badge__name">Anglap.ai</span>
                <span className="brand-badge__tagline">Restaurant Intelligence</span>
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
                        enterKeyHint="search"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(""); setShowResults(false); setSearchResults([]); }}
                            className="search-clear-btn"
                            aria-label="Clear search"
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
                onClose={handleClose}
            />
        </>
    );
}
