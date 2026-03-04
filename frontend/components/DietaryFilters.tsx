"use client";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import LiquidGlass from "@/components/LiquidGlass";

export interface DietaryFilter {
    id: string;
    label: string;
    icon: string;
    keywords: string[];            // search terms to match cuisine/name
    color: string;                 // active pill accent color
}

const FILTERS: DietaryFilter[] = [
    {
        id: "vegan",
        label: "Vegan",
        icon: "🌱",
        keywords: ["vegan", "plant-based", "plant based", "raw food"],
        color: "#22c55e",
    },
    {
        id: "vegetarian",
        label: "Vegetarian",
        icon: "🥬",
        keywords: ["vegetarian", "veggie", "meatless", "lacto"],
        color: "#4ade80",
    },
    {
        id: "halal",
        label: "Halal",
        icon: "☪️",
        keywords: ["halal", "islamic", "middle eastern", "persian", "afghan", "turkish", "lebanese", "moroccan", "arabic", "egyptian", "iranian", "pakistani"],
        color: "#60a5fa",
    },
    {
        id: "kosher",
        label: "Kosher",
        icon: "✡️",
        keywords: ["kosher", "jewish", "deli"],
        color: "#818cf8",
    },
    {
        id: "gluten_free",
        label: "Gluten-Free",
        icon: "🌾",
        keywords: ["gluten-free", "gluten free", "celiac", "gf"],
        color: "#f59e0b",
    },
    {
        id: "seafood",
        label: "Seafood",
        icon: "🐟",
        keywords: ["seafood", "fish", "sushi", "poke", "oyster", "crab", "lobster", "shrimp", "salmon"],
        color: "#06b6d4",
    },
    {
        id: "organic",
        label: "Organic",
        icon: "🍃",
        keywords: ["organic", "farm-to-table", "farm to table", "locally sourced"],
        color: "#84cc16",
    },
    {
        id: "mediterranean",
        label: "Mediterranean",
        icon: "🫒",
        keywords: ["mediterranean", "greek", "italian", "spanish", "tapas"],
        color: "#f97316",
    },
    {
        id: "asian",
        label: "Asian",
        icon: "🥢",
        keywords: ["asian", "chinese", "japanese", "korean", "thai", "vietnamese", "indian", "ramen", "dim sum", "dumpling", "noodle", "curry", "wok"],
        color: "#ef4444",
    },
    {
        id: "mexican",
        label: "Latin",
        icon: "🌮",
        keywords: ["mexican", "latin", "tacos", "burrito", "argentine", "brazilian", "colombian", "peruvian", "salvadoran", "cuban"],
        color: "#eab308",
    },
];

interface DietaryFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    activeFilters: Set<string>;
    onToggleFilter: (filterId: string) => void;
    onClearAll: () => void;
    matchCount: number;
}

export default function DietaryFilters({
    isOpen,
    onClose,
    activeFilters,
    onToggleFilter,
    onClearAll,
    matchCount,
}: DietaryFiltersProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="dietary-filter-panel"
            style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "340px",
                maxWidth: "calc(100vw - 32px)",
                background: "var(--glass-bg)",
                backgroundImage: "var(--glass-shine)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)" as string,
                border: "1px solid var(--glass-border)",
                borderRadius: "20px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                padding: "20px",
                zIndex: 200,
                animation: "filterSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
        >
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "14px",
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    Dietary Filters
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {activeFilters.size > 0 && (
                        <button
                            onClick={onClearAll}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                padding: "4px 8px",
                            }}
                        >
                            Clear All
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Filter pills grid */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
            }}>
                {FILTERS.map((filter) => {
                    const isActive = activeFilters.has(filter.id);
                    return (
                        <LiquidGlass key={filter.id} tiltMax={10} glareOpacity={0.15}>
                            <button
                                onClick={() => onToggleFilter(filter.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "9999px",
                                    border: `1px solid ${isActive ? filter.color + "60" : "var(--glass-border)"}`,
                                    background: isActive
                                        ? filter.color + "20"
                                        : "var(--glass-bg)",
                                    color: isActive ? filter.color : "var(--text-primary)",
                                    fontSize: "12px",
                                    fontWeight: isActive ? 700 : 500,
                                    cursor: "pointer",
                                    transition: "all 0.25s ease",
                                    boxShadow: isActive
                                        ? `0 0 12px ${filter.color}15, inset 0 1px 0 rgba(255,255,255,0.08)`
                                        : "inset 0 1px 0 rgba(255,255,255,0.04)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <span style={{ fontSize: "14px" }}>{filter.icon}</span>
                                {filter.label}
                            </button>
                        </LiquidGlass>
                    );
                })}
            </div>

            {/* Match count */}
            {activeFilters.size > 0 && (
                <div style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--glass-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                }}>
                    <span>
                        Showing <strong style={{ color: "#4fc3f7" }}>{matchCount}</strong> matching restaurants
                    </span>
                    <span style={{
                        background: "rgba(79, 195, 247, 0.15)",
                        color: "#4fc3f7",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                    }}>
                        {activeFilters.size} filter{activeFilters.size !== 1 ? "s" : ""}
                    </span>
                </div>
            )}
        </div>
    );
}

export { FILTERS };
export type { DietaryFilter as DietaryFilterType };
