"use client";
import { useEffect, useRef } from "react";

interface ScoreRingProps {
    score: number;
    size?: number;
    label: string;
    sublabel?: string;
    invert?: boolean;
}

function getScoreColor(score: number, invert = false): string {
    const s = invert ? 100 - score : score;
    if (s >= 65) return "#ef5350";
    if (s >= 40) return "#ffa726";
    return "#66bb6a";
}

export default function ScoreRing({
    score,
    size = 90,
    label,
    sublabel,
    invert = false,
}: ScoreRingProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const color = getScoreColor(score, invert);
    const pct = score / 100;
    const cx = size / 2;
    const r = (size - 12) / 2;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);

        // Track
        ctx.beginPath();
        ctx.arc(cx, cx, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 8;
        ctx.stroke();

        // Progress arc
        const start = -Math.PI / 2;
        const end = start + pct * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cx, r, start, end);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.stroke();
    }, [score, size, color, pct, cx, r]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                flex: 1,
                padding: "14px 12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
            }}
        >
            <div style={{ position: "relative", width: size, height: size }}>
                <canvas ref={canvasRef} width={size} height={size} />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color,
                            letterSpacing: "-0.5px",
                        }}
                    >
                        {Math.round(score)}
                    </span>
                </div>
            </div>
            <div style={{ textAlign: "center" }}>
                <div
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}
                >
                    {label}
                </div>
                {sublabel && (
                    <div
                        style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}
                    >
                        {sublabel}
                    </div>
                )}
            </div>
        </div>
    );
}
