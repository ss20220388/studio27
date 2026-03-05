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
  "#7C444F", 
  "#9F5255", 
  "#E16A54"  
]

export default function ProgressChart() {
    return (
        <div className="w-full h-[260px]">

            <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                    <Pie
                        data={data}
                        dataKey="value"
                        outerRadius="70%"
                        innerRadius="40%"
                        paddingAngle={3}
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={COLORS[index]} />
                        ))}
                    </Pie>

                    <Tooltip />

                    <Legend
                        verticalAlign="bottom"
                        height={36}
                    />

                </PieChart>

            </ResponsiveContainer>

        </div>
    )
}