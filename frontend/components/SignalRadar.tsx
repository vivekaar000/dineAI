"use client";
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface Props {
    signals: Record<string, { score: number; label: string }>;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { subject: string; value: number } }[] }) => {
    if (active && payload?.length) {
        const d = payload[0].payload;
        return (
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
            }}>
                <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 2 }}>{d.subject}</div>
                <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: 18 }}>{Math.round(d.value)}</div>
            </div>
        );
    }
    return null;
};

export default function SignalRadar({ signals }: Props) {
    const data = Object.entries(signals).map(([key, val]) => ({
        subject: val.label,
        value: Math.round(val.score),
        fullMark: 100,
    }));

    return (
        <div className="chart-card">
            <div className="chart-title">Signal Radar</div>
            <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#8a8a8a", fontSize: 10, fontFamily: "Inter" }}
                    />
                    <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#4fc3f7"
                        fill="#4fc3f7"
                        fillOpacity={0.18}
                        strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
