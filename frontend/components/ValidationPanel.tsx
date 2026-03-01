"use client";
import { useState, useEffect } from "react";
import { submitValidation, getValidationStats, ValidationStats } from "@/lib/api";

interface Props {
    restaurantId: number;
    predictedLabel: string;
    ttsScore: number;
}

const LABELS = ["local", "mixed", "tourist"] as const;
type Label = (typeof LABELS)[number];

export default function ValidationPanel({ restaurantId, predictedLabel, ttsScore }: Props) {
    const [selected, setSelected] = useState<Label | null>(null);
    const [lastResult, setLastResult] = useState<{ correct: boolean; predicted: string } | null>(null);
    const [stats, setStats] = useState<ValidationStats | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getValidationStats().then(setStats).catch(() => { });
    }, [lastResult]);

    const handleSubmit = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            const res = await submitValidation(restaurantId, selected);
            setLastResult({ correct: res.correct, predicted: res.predicted_label });
            const s = await getValidationStats();
            setStats(s);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="validation-section">
            <div className="validation-title">Competition Mode — Manual Label</div>

            <div
                style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px",
                    marginBottom: 16,
                }}
            >
                <div className="stat-row">
                    <span className="stat-label">TTS Score</span>
                    <span
                        className="stat-value"
                        style={{
                            color:
                                ttsScore >= 65
                                    ? "var(--danger)"
                                    : ttsScore >= 40
                                        ? "var(--warning)"
                                        : "var(--success)",
                        }}
                    >
                        {ttsScore.toFixed(1)} / 100
                    </span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">Model Prediction</span>
                    <span className={`badge badge-${predictedLabel}`} style={{ fontSize: 11 }}>
                        {predictedLabel === "tourist" ? "Visitor-Oriented" : predictedLabel === "local" ? "Local Favorite" : "Mixed"}
                    </span>
                </div>
            </div>

            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                Assign the true label for this restaurant to validate model accuracy:
            </div>

            <div className="label-buttons">
                {LABELS.map((l) => (
                    <button
                        key={l}
                        className={`label-btn ${l} ${selected === l ? "selected" : ""}`}
                        onClick={() => setSelected(l)}
                    >
                        {l === "local" ? "🏠 Local" : l === "tourist" ? "✈️ Visitor" : "🔄 Mixed"}
                    </button>
                ))}
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={!selected || loading}>
                {loading ? "Submitting…" : "Submit Label"}
            </button>

            {lastResult && (
                <div
                    style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        background: lastResult.correct
                            ? "rgba(102,187,106,0.1)"
                            : "rgba(239,83,80,0.1)",
                        border: `1px solid ${lastResult.correct ? "rgba(102,187,106,0.3)" : "rgba(239,83,80,0.3)"}`,
                        fontSize: 13,
                        color: lastResult.correct ? "var(--success)" : "var(--danger)",
                    }}
                >
                    {lastResult.correct
                        ? "✓ Correct prediction"
                        : `✗ Model predicted "${lastResult.predicted}", you said "${selected}"`}
                </div>
            )}

            {stats && stats.total_samples > 0 && (
                <div style={{ marginTop: 20 }}>
                    <div className="validation-title" style={{ fontSize: 14 }}>
                        Accuracy Stats ({stats.total_samples} samples)
                    </div>

                    <div
                        style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "14px",
                            marginTop: 12,
                        }}
                    >
                        <div className="stat-row">
                            <span className="stat-label">Overall Accuracy</span>
                            <span
                                className="stat-value"
                                style={{
                                    color:
                                        (stats.accuracy ?? 0) >= 0.7
                                            ? "var(--success)"
                                            : (stats.accuracy ?? 0) >= 0.5
                                                ? "var(--warning)"
                                                : "var(--danger)",
                                    fontSize: 18,
                                    fontWeight: 700,
                                }}
                            >
                                {((stats.accuracy ?? 0) * 100).toFixed(1)}%
                            </span>
                        </div>

                        {stats.precision && (
                            <>
                                {Object.entries(stats.precision).map(([cls, prec]) => (
                                    <div className="stat-row" key={cls}>
                                        <span className="stat-label">
                                            Precision ({cls === "tourist" ? "Visitor-Oriented" : cls === "local" ? "Local" : "Mixed"})
                                        </span>
                                        <span className="stat-value">{(prec * 100).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {stats.confusion_matrix && stats.confusion_labels && (
                        <div style={{ marginTop: 16 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: 10,
                                }}
                            >
                                Confusion Matrix
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table className="confusion-matrix">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left" }}>True ↓ / Pred →</th>
                                            {stats.confusion_labels.map((l) => (
                                                <th key={l}>{l}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.confusion_matrix.map((row, ri) => (
                                            <tr key={ri}>
                                                <th>{stats.confusion_labels[ri]}</th>
                                                {row.map((val, ci) => (
                                                    <td key={ci} className={ri === ci ? "diagonal" : ""}>
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
