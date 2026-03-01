"use client";
import { useEffect, useRef, useState } from "react";

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
    const animRef = useRef<number>(0);
    const [displayScore, setDisplayScore] = useState(0);
    const color = getScoreColor(score, invert);
    const cx = size / 2;
    const r = (size - 12) / 2;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Animate the ring filling and counter
        const duration = 1000;
        const start = performance.now();
        const targetPct = score / 100;

        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentPct = targetPct * ease;

            ctx.clearRect(0, 0, size, size);

            // Track
            ctx.beginPath();
            ctx.arc(cx, cx, r, 0, Math.PI * 2);
            ctx.strokeStyle = "#222";
            ctx.lineWidth = 8;
            ctx.stroke();

            // Progress arc
            const arcStart = -Math.PI / 2;
            const arcEnd = arcStart + currentPct * Math.PI * 2;
            if (currentPct > 0) {
                ctx.beginPath();
                ctx.arc(cx, cx, r, arcStart, arcEnd);
                ctx.strokeStyle = color;
                ctx.lineWidth = 8;
                ctx.lineCap = "round";
                ctx.stroke();
            }

            setDisplayScore(Math.round(score * ease));

            if (progress < 1) {
                animRef.current = requestAnimationFrame(animate);
            }
        };

        animRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animRef.current);
    }, [score, size, color, cx, r]);

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
                transition: "all 0.3s ease",
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
                            fontSize: 22,
                            fontWeight: 700,
                            color,
                            letterSpacing: "-0.5px",
                            transition: "color 0.3s ease",
                        }}
                    >
                        {displayScore}
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
