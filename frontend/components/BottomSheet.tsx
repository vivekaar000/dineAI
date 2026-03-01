"use client";
import { useState } from "react";
import { X } from "lucide-react";
import ScoreRing from "./ScoreRing";
import SignalRadar from "./SignalRadar";
import SignalBar from "./SignalBar";
import ValidationPanel from "./ValidationPanel";
import { AnalysisResult } from "@/lib/api";

interface Props {
    analysis: AnalysisResult | null;
    loading: boolean;
    onClose: () => void;
}

function getScoreColor(score: number): string {
    if (score >= 65) return "var(--score-high)";
    if (score >= 40) return "var(--score-mid)";
    return "var(--score-low)";
}

function getBarFill(score: number): string {
    if (score >= 65) return "#ef5350";
    if (score >= 40) return "#ffa726";
    return "#66bb6a";
}

function labelClass(label: string) {
    if (label === "tourist") return "badge badge-tourist";
    if (label === "local") return "badge badge-local";
    return "badge badge-mixed";
}

const SIGNAL_KEYS = [
    "price_inflation",
    "review_linguistics",
    "tourist_density",
    "menu_engineering",
    "repeat_local",
    "attraction_proximity",
] as const;

const WEIGHTS: Record<string, number> = {
    price_inflation: 0.22,
    review_linguistics: 0.18,
    tourist_density: 0.15,
    menu_engineering: 0.15,
    repeat_local: 0.15,
    attraction_proximity: 0.15,
};

export default function BottomSheet({ analysis, loading, onClose }: Props) {
    const [tab, setTab] = useState<"overview" | "signals" | "validation">("overview");
    const isOpen = loading || !!analysis;

    return (
        <div className={`bottom-sheet ${isOpen ? "open" : ""}`}>
            <div className="sheet-handle" />

            {loading && !analysis ? (
                <div style={{ padding: "32px 24px", textAlign: "center" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Running analysis…
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="shimmer"
                                style={{ width: 60, height: 8, animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                </div>
            ) : analysis ? (
                <>
                    {/* Fixed header + tabs */}
                    <div style={{ padding: "0 24px", flexShrink: 0 }}>
                        <div className="sheet-header">
                            <div>
                                <div className="sheet-title">{analysis.restaurant.name}</div>
                                <div className="sheet-subtitle">
                                    {analysis.restaurant.cuisine && `${analysis.restaurant.cuisine} · `}
                                    {analysis.restaurant.city}
                                    {analysis.restaurant.address && ` · ${analysis.restaurant.address.split(",")[0]}`}
                                </div>
                            </div>
                            <button className="sheet-close" onClick={onClose}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Score rings */}
                        <div className="score-rings">
                            <ScoreRing
                                score={analysis.tts_score}
                                label="Tourist Score"
                                sublabel="Higher = more targeted"
                            />
                            <ScoreRing
                                score={analysis.local_authenticity_score}
                                label="Local Score"
                                sublabel="Higher = more authentic"
                                invert
                            />
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                    padding: "14px 12px",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-md)",
                                }}
                            >
                                <div
                                    className={labelClass(analysis.predicted_label)}
                                    style={{ fontSize: 12 }}
                                >
                                    {analysis.predicted_label === "tourist"
                                        ? "Visitor-Oriented"
                                        : analysis.predicted_label === "local"
                                            ? "Local Favorite"
                                            : "Mixed Profile"}
                                </div>
                                {analysis.signals.price_inflation.inflation_pct !== undefined && (
                                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, textAlign: "center" }}>
                                        Price{" "}
                                        <span
                                            style={{
                                                color: (analysis.signals.price_inflation.inflation_pct ?? 0) > 0
                                                    ? "var(--danger)"
                                                    : "var(--success)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {(analysis.signals.price_inflation.inflation_pct ?? 0) > 0 ? "+" : ""}
                                            {analysis.signals.price_inflation.inflation_pct?.toFixed(1)}%
                                        </span>{" "}
                                        vs avg
                                    </div>
                                )}
                                {analysis.signals.attraction_proximity.nearest_attraction && (
                                    <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 2 }}>
                                        {analysis.signals.attraction_proximity.distance_m != null
                                            ? `${Math.round(analysis.signals.attraction_proximity.distance_m)}m`
                                            : ""}{" "}
                                        from {analysis.signals.attraction_proximity.nearest_attraction}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="tab-bar">
                            {(["overview", "signals", "validation"] as const).map((t) => (
                                <button
                                    key={t}
                                    className={`tab ${tab === t ? "active" : ""}`}
                                    onClick={() => setTab(t)}
                                >
                                    {t === "overview"
                                        ? "Overview"
                                        : t === "signals"
                                            ? "Signals"
                                            : "Validate"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="sheet-content">
                        {tab === "overview" && (
                            <>
                                {/* Signal cards grid */}
                                <div className="signal-grid">
                                    {SIGNAL_KEYS.map((key) => {
                                        const sig = analysis.signals[key];
                                        const score = sig?.score ?? 0;
                                        const color = getBarFill(score);
                                        return (
                                            <div className="signal-card" key={key}>
                                                <div className="signal-label">{sig?.label}</div>
                                                <div
                                                    className="signal-value"
                                                    style={{ color }}
                                                >
                                                    {Math.round(score)}
                                                </div>
                                                <div className="signal-bar">
                                                    <div
                                                        className="signal-bar-fill"
                                                        style={{
                                                            width: `${score}%`,
                                                            background: color,
                                                        }}
                                                    />
                                                </div>
                                                <div className="signal-extra">
                                                    {key === "price_inflation" && sig.inflation_pct !== undefined
                                                        ? `${sig.inflation_pct > 0 ? "+" : ""}${sig.inflation_pct?.toFixed(1)}% vs cuisine avg`
                                                        : key === "attraction_proximity" && sig.nearest_attraction
                                                            ? sig.nearest_attraction
                                                            : `Weight: ${(WEIGHTS[key] * 100).toFixed(0)}%`}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Charts */}
                                <div className="chart-grid">
                                    <SignalRadar signals={analysis.signals} />
                                    <SignalBar
                                        signals={analysis.signals}
                                        restaurantName={analysis.restaurant.name}
                                    />
                                </div>

                                {/* Methodology note */}
                                <div
                                    style={{
                                        padding: "12px 14px",
                                        background: "var(--bg-card)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: 12,
                                        color: "var(--text-secondary)",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>How scores are calculated: </span>
                                    Scores combine AI-powered review sentiment analysis, real-time Google Places API tourist density,
                                    price benchmarking vs cuisine averages, menu engineering detection, reviewer locality metrics,
                                    and attraction proximity. All signals are normalized 0–100 before weighted combination.
                                </div>
                            </>
                        )}

                        {tab === "signals" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {SIGNAL_KEYS.map((key) => {
                                    const sig = analysis.signals[key];
                                    const score = sig?.score ?? 0;
                                    return (
                                        <div
                                            key={key}
                                            style={{
                                                background: "var(--bg-card)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "var(--radius-md)",
                                                padding: "16px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{sig?.label}</div>
                                                    <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
                                                        Weight: {(WEIGHTS[key] * 100).toFixed(0)}% · Contribution:{" "}
                                                        {((score * WEIGHTS[key])).toFixed(1)} pts
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 28,
                                                        fontWeight: 700,
                                                        color: getBarFill(score),
                                                    }}
                                                >
                                                    {Math.round(score)}
                                                </div>
                                            </div>
                                            <div className="signal-bar" style={{ height: 4 }}>
                                                <div
                                                    className="signal-bar-fill"
                                                    style={{
                                                        width: `${score}%`,
                                                        background: getBarFill(score),
                                                    }}
                                                />
                                            </div>
                                            {key === "price_inflation" && sig.inflation_pct !== undefined && (
                                                <div className="signal-extra" style={{ marginTop: 8 }}>
                                                    Price inflation vs cuisine average:{" "}
                                                    <strong style={{ color: sig.inflation_pct > 0 ? "var(--danger)" : "var(--success)" }}>
                                                        {sig.inflation_pct > 0 ? "+" : ""}{sig.inflation_pct?.toFixed(1)}%
                                                    </strong>
                                                </div>
                                            )}
                                            {key === "attraction_proximity" && sig.nearest_attraction && (
                                                <div className="signal-extra" style={{ marginTop: 8 }}>
                                                    Nearest major attraction: <strong>{sig.nearest_attraction}</strong>
                                                    {sig.distance_m != null && ` (${Math.round(sig.distance_m)}m away)`}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {tab === "validation" && analysis.restaurant.id && (
                            <ValidationPanel
                                restaurantId={analysis.restaurant.id}
                                predictedLabel={analysis.predicted_label}
                                ttsScore={analysis.tts_score}
                            />
                        )}
                        {tab === "validation" && !analysis.restaurant.id && (
                            <div style={{ color: "var(--text-secondary)", fontSize: 13, padding: "20px 0" }}>
                                Validation is available for restaurants in the local database only.
                            </div>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}
