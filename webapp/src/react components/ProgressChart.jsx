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
    "#34d399",
    "#7f1d1d",
    "#525252"
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
                            backgroundColor: "#faf5f5",
                            border: "1px solid #c7bdbd",
                            borderRadius: "8px",
                            color: "#e5e5e5",
                            fontSize: "12px",
                        }}
                    />

                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                            <span style={{ color: "#a3a3a3", fontSize: "12px" }}>
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}