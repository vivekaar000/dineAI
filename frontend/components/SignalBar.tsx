"use client";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface Props {
    signals: Record<string, { score: number; label: string }>;
    restaurantName: string;
}

function getBarColor(score: number): string {
    if (score >= 65) return "#ef5350";
    if (score >= 40) return "#ffa726";
    return "#66bb6a";
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; payload: { name: string } }[] }) => {
    if (active && payload?.length) {
        const v = payload[0].value;
        return (
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
            }}>
                <div style={{ color: getBarColor(v), fontWeight: 700, fontSize: 20 }}>{Math.round(v)}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>/ 100</div>
            </div>
        );
    }
    return null;
};

export default function SignalBar({ signals, restaurantName }: Props) {
    const data = Object.entries(signals).map(([, val]) => ({
        name: val.label.replace(" Proxy", "").replace("Repeat Local", "Local Proxy"),
        score: Math.round(val.score),
    }));

    return (
        <div className="chart-card">
            <div className="chart-title">Score Breakdown</div>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
                    <CartesianGrid
                        horizontal={false}
                        stroke="rgba(255,255,255,0.04)"
                    />
                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: "#555", fontSize: 10 }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fill: "#8a8a8a", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={18}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={getBarColor(entry.score)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
