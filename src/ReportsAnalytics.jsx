
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Recycle,
  Weight,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useMaterialStats from "./hooks/useMaterialStats";

export default function ReportsAnalytics({ onBack }) {
  const { materials, stats } = useMaterialStats();
  const [range, setRange] = useState("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : null;

    return materials.filter((item) => {
      if (!days) return true;

      const date = new Date(item.createdAt || item.date || 0).getTime();
      return Number.isFinite(date) && date >= now - days * 86400000;
    });
  }, [materials, range]);

  const completed = filtered.filter((item) =>
    ["recycled", "reused", "composted"].includes(
      String(item.status || "").toLowerCase()
    )
  );

  const weight = filtered.reduce(
    (sum, item) => sum + (Number(item.weight) || 0),
    0
  );

  const categories = useMemo(() => {
    const counts = {};

    filtered.forEach((item) => {
      const name = item.category || "Uncategorized";
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
    }));
  }, [filtered]);

  function exportCSV() {
    const columns = [
      ["Name", (item) => item.name || item.item || ""],
      ["Category", (item) => item.category || ""],
      ["Material", (item) => item.material || ""],
      ["Weight", (item) => item.weight ?? 0],
      ["Status", (item) => item.status || "pending"],
      [
        "Created At",
        (item) => item.createdAt || item.date || "",
      ],
      [
        "Recommendation",
        (item) => item.recommendation || item.advice || "",
      ],
    ];

    const quote = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.map(([label]) => quote(label)).join(","),
      ...filtered.map((item) =>
        columns.map(([, getter]) => quote(getter(item))).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ecotwin-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const cardClass =
    "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-green-700"
          >
            <ArrowLeft size={16} /> Back to Overview
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Insights calculated from your saved material records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2"
          >
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-white hover:bg-green-800"
          >
            <Download size={17} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<FileText />}
          label="Records"
          value={filtered.length}
        />
        <Metric
          icon={<CheckCircle2 />}
          label="Completed actions"
          value={completed.length}
        />
        <Metric
          icon={<Weight />}
          label="Tracked weight"
          value={`${weight.toFixed(2)} kg`}
        />
        <Metric
          icon={<Recycle />}
          label="Completion rate"
          value={`${filtered.length
            ? Math.round((completed.length / filtered.length) * 100)
            : 0}%`}
        />
      </div>

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Material category breakdown
        </h2>

        {categories.length ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Records" fill="#15803d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500">
            No records for this period. Scan and save an item to generate
            your report.
          </p>
        )}
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent material records
        </h2>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="p-3">Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((item, index) => (
                  <tr
                    key={item.id || `${item.name}-${index}`}
                    className="border-b last:border-0"
                  >
                    <td className="p-3 font-medium">
                      {item.name || item.item || "Unnamed item"}
                    </td>
                    <td className="p-3">
                      {item.category || "Uncategorized"}
                    </td>
                    <td className="p-3">
                      {Number(item.weight || 0)} kg
                    </td>
                    <td className="p-3 capitalize">
                      {item.status || "pending"}
                    </td>
                    <td className="p-3">
                      {item.createdAt || item.date
                        ? new Date(
                            item.createdAt || item.date
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-gray-500">
            No saved material records yet.
          </p>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Reports reflect records stored in this browser. They are not a
        centralized or cloud-synchronized report.
      </p>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-green-700">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
