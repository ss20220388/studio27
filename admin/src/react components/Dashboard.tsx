interface StatCardType {
  label: string;
  value: string | number;
  up: boolean;
  icon: React.ReactNode;
}
import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";





const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-neutral-400 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name === "zarada"
              ? `${(entry.value).toFixed(0)}RSD`
              : `${entry.value} korisnika`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ students, prihodi, kursProdato, stats }: { students: any[]; prihodi: any[], kursProdato: any[], stats: { activeStudents: number, kupovineOvogMeseca: number, prihodiOvogMeseca: number, brojKurseva: number } }) {
  const [chartTab, setChartTab] = useState<"zarada" | "korisnici">("zarada");
  const [fullStats, setFullStats] = useState<StatCardType[]>([]);

  React.useEffect(() => {
    setFullStats([
      {
        label: "Ukupno aktivnih korisnika",
        value: stats?.activeStudents ?? "0",
        up: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        ),
      },
      {
        label: "Kupovine ovog meseca",
        value: stats?.kupovineOvogMeseca ?? "0",
        up: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        label: "Prihod ovog meseca",
        value: stats?.prihodiOvogMeseca ?? "0 RSD",
        up: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        label: "Aktivni kursevi",
        value: stats?.brojKurseva ?? "0",
        up: true,
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        ),
      },
    ])
  }, [stats]);
  return (
    <div className=" px-4 animate-fade-in max-w-7xl flex flex-col justify-center items-center flex-1 gap-8  mx-auto w-full">
      <div className="flex items-end justify-between x-12 pb-5 border-b border-neutral-800/60 w-full">
        <div className="w-full p-4" style={{ paddingInline: "10px" }} >
          <p className="text-xs  font-semibold text-neutral-600 uppercase tracking-widest mb-1">Pregled</p>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">Statistike i aktivnosti za tekući period</p>
        </div>
        <div className="text-xs text-neutral-600 pb-1">Mar 2026</div>
      </div>

      {/* Stat cards */}
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 stagger-children max-w-7xl">
        {fullStats.map((s, i) => (
          <div
            style={{ paddingInline: "20px", paddingBlock: "10px" }}
            key={i}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>


      {/* Charts row */}
      <div className="grid w-full grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl">
        {/* Main chart */}
        <div className="xl:col-span-2 mb-4 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Rast tokom godine</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Mesečni pregled</p>
            </div>
            <div className="flex bg-neutral-800 rounded-lg border border-neutral-700 p-0.5">
              <button
                onClick={() => setChartTab("zarada")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${chartTab === "zarada"
                  ? "bg-red-900 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
                  }`}
              >
                Prihod
              </button>
              <button
                onClick={() => setChartTab("korisnici")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${chartTab === "korisnici"
                  ? "bg-red-900 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
                  }`}
              >
                Korisnici
              </button>
            </div>
          </div>

          <div className="h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={prihodi}>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7f1d1d" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="mesec"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    chartTab === "zarada" ? `${(v).toFixed(0)}RSD` : `${v}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartTab}
                  stroke="#991b1b"
                  strokeWidth={2}
                  fill="url(#gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course bar chart */}
        <div className="bg-neutral-900  border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Prodaja po kursu</h2>
          <p className="text-xs text-neutral-500 mb-6">Ukupno prodatih pristupa</p>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={kursProdato} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="naziv"
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={85}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    background: "#262626",
                    border: "1px solid #404040",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#a3a3a3" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="prodato" fill="#991b1b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* Recent activity table */}
      <div className="bg-neutral-900 border w-full mb-10 border-neutral-800 rounded-xl overflow-hidden max-w-7xl" style={{ paddingInline: "20px", paddingBlock: "10px" }}>
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Poslednje kupovine</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Najnovije aktivnosti korisnika</p>
          </div>
          <a
            href="/studenti"
            className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Prikaži sve →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
                  Korisnik
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
                  Email
                </th>

                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((u, i) => (
                <tr
                  key={i}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300">
                        {u.ime
                          .split(" ")
                          .map((w: any) => w[0])
                          .join("")}
                      </div>
                      <span className="font-medium text-neutral-200">{u.ime}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${u.active == 1
                        ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30"
                        : "bg-neutral-800 text-neutral-500 border border-neutral-700"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${u.active == 1 ? "bg-emerald-400" : "bg-neutral-600"
                          }`}
                      />
                      {u.active == 1 ? "Aktivan" : "Neaktivan"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <br />
    </div>
  );
}
