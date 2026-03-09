import {
    PieChart,
    Pie,
    Tooltip,
    Legend,
    Cell,
    ResponsiveContainer
} from "recharts"

const data = [
    { name: "Završeno", value: 1 },
    { name: "U toku", value: 3 },
    { name: "Nije početo", value: 1 }
]

const COLORS = [
  "#34d399",
  "#7f1d1d",
  "#525252"
]

export default function ProgressChart() {
    return (
        <div className="w-full h-[260px]">

            <ResponsiveContainer minWidth={250} minHeight={250} width={"100%"} height={"100%"}>

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
                            backgroundColor: "#171717",
                            border: "1px solid #262626",
                            borderRadius: "8px",
                            color: "#e5e5e5",
                            fontSize: "12px",
                        }}
                    />

                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span style={{ color: "#a3a3a3", fontSize: "12px" }}>{value}</span>}
                    />

                </PieChart>

            </ResponsiveContainer>

        </div>
    )
}