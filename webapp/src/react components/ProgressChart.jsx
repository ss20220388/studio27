import React, { useState, useEffect } from "react";
import {
    PieChart,
    Pie,
    Tooltip,
    Legend,
    Cell,
    ResponsiveContainer
} from "recharts";

const COLORS = [
    "var(--color-emerald-400)",
    "var(--color-red-900)",
    "var(--color-neutral-600)"
];

export default function ProgressChart({
    zavrseno = 0,
    uToku = 0,
    nijePoceto = 0,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const data = [
        { name: "Završeno", value: zavrseno },
        { name: "U toku", value: uToku },
        { name: "Nije početo", value: nijePoceto },
    ];

    if (!mounted) return null;

    return (
        <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        outerRadius="70%"
                        innerRadius="40%"
                        paddingAngle={3}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index]} />
                        ))}
                    </Pie>

                    <Tooltip
                        contentStyle={{
                            backgroundColor: "var(--color-neutral-900)",
                            border: "1px solid var(--color-neutral-700)",
                            borderRadius: "8px",
                            color: "var(--color-neutral-200)",
                            fontSize: "12px",
                        }}
                    />

                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                            <span style={{ color: "var(--color-neutral-400)", fontSize: "12px" }}>
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}