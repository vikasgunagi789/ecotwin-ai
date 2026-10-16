
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Bot,
  Boxes,
  ChevronDown,
  Cpu,
  FileText,
  Globe2,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  Package,
  Recycle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import WasteScanner from "./WasteScanner.jsx";
import MaterialTracking from "./MaterialTracking.jsx";
import useMaterialStats from "./hooks/useMaterialStats.js";
import { getMaterials } from "./utils/materialTracker.js";
import ImpactRewards from "./ImpactRewards.jsx";
import DigitalTwin from "./DigitalTwin.jsx";
import EcoCoach from "./EcoCoach.jsx";
import CollectionCenters from "./CollectionCenters.jsx";
import ReportsAnalytics from "./ReportsAnalytics.jsx";
import WorkspaceSettings from "./WorkspaceSettings.jsx";


const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "AI Waste Scanner", icon: Target },
  { label: "Digital Twin", icon: Boxes },
  { label: "AI Eco Coach", icon: Bot },
  { label: "Material Tracking", icon: Package },
  { label: "Impact & Rewards", icon: Sprout },
];


// const sampleWeeklyData = [
//   { day: "Mon", recycled: 42, reused: 18, organic: 25 },
//   { day: "Tue", recycled: 55, reused: 26, organic: 32 },
//   { day: "Wed", recycled: 48, reused: 31, organic: 27 },
//   { day: "Thu", recycled: 70, reused: 38, organic: 44 },
//   { day: "Fri", recycled: 63, reused: 43, organic: 39 },
//   { day: "Sat", recycled: 82, reused: 51, organic: 48 },
//   { day: "Sun", recycled: 76, reused: 58, organic: 55 },
// ];

function ScanIcon(props) {
  return <Target {...props} />;
}

function getCategoryColor(category = "") {
  const value = String(category).toLowerCase();

  if (value.includes("hazard") || value.includes("battery")) {
    return "red";
  }

  if (
    value.includes("organic") ||
    value.includes("biodegradable") ||
    value.includes("compost") ||
    value.includes("reusable")
  ) {
    return "green";
  }

  if (value.includes("plastic") || value.includes("metal")) {
    return "blue";
  }

  return "amber";
}

function getStatusColor(status = "") {
  const value = String(status).toLowerCase();

  if (
    value.includes("recycled") ||
    value.includes("completed") ||
    value.includes("collected")
  ) {
    return "green";
  }

  if (
    value.includes("hazard") ||
    value.includes("failed")
  ) {
    return "red";
  }

  if (
    value.includes("processing") ||
    value.includes("progress")
  ) {
    return "blue";
  }

  return "amber";
}

function formatTime(dateValue) {
  if (!dateValue) return "Recently added";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently added";
  }

  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

function Sidebar({ active, setActive, open, setOpen }) {
  const managementItems = [
    { label: "Reports & Analytics", icon: FileText },
    { label: "Settings", icon: Settings },
  ];

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-[#e8eee8] bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-[#edf1ed] px-6">
          <button
            onClick={() => {
              setActive("Overview");
              setOpen(false);
            }}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#176b48] text-white shadow-md shadow-green-900/15">
              <Recycle size={23} />
            </div>

            <div>
              <div className="text-[19px] font-extrabold tracking-tight text-[#173c2b]">
                EcoTwin<span className="text-[#1c9b68]"> AI</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[2px] text-[#91a397]">
                Circular Intelligence
              </div>
            </div>
          </button>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-gray-500 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-[#a1aea5]">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActive(label);
                  setOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition-all ${
                  active === label
                    ? "bg-[#eaf5ed] text-[#176b48] shadow-sm"
                    : "text-[#78877d] hover:bg-[#f5f8f5] hover:text-[#244b36]"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active === label ? 2.4 : 1.8}
                />

                <span className="flex-1">{label}</span>

                {label === "AI Waste Scanner" && (
                  <span className="rounded-md bg-[#d9f0e1] px-1.5 py-0.5 text-[9px] font-extrabold text-[#167348]">
                    AI
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 px-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-[#a1aea5]">
            Management
          </p>

          {managementItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition ${
                active === label
                  ? "bg-[#eaf5ed] text-[#176b48]"
                  : "text-[#78877d] hover:bg-[#f5f8f5]"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-auto p-4">
          <div className="relative overflow-hidden rounded-2xl bg-[#163f2c] p-4 text-white">
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/5" />

            <div className="relative flex items-center gap-2 text-[12px] font-bold">
              <Sparkles size={15} className="text-[#9be6b4]" />
              Eco impact goal
            </div>

            <div className="relative mt-4 flex items-end justify-between">
              <div>
                <span className="text-2xl font-extrabold">72%</span>
                <p className="mt-1 text-[10px] text-white/60">
                  Monthly target
                </p>
              </div>

              <span className="text-[10px] text-[#b7efc8]">
                Illustrative goal
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-[72%] rounded-full bg-[#82dca4]" />
            </div>

            <p className="mt-3 text-[10px] leading-relaxed text-white/60">
              Small actions create a circular future.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-[#edf1ed] pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f2e8] text-sm font-bold text-[#176b48]">
              EC
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#254431]">
                Eco Administrator
              </p>
              <p className="mt-0.5 text-[10px] text-[#91a095]">
                Campus workspace
              </p>
            </div>

            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </aside>
    </>
  );
}

function MetricCard({ metric }) {
  const Icon = metric.icon;

  const tones = {
    green: "bg-[#e7f5eb] text-[#258052]",
    blue: "bg-[#e9f1ff] text-[#497bd3]",
    purple: "bg-[#f1ebff] text-[#8b68d5]",
    orange: "bg-[#fff0df] text-[#d58b35]",
  };

  return (
    <div className="rounded-2xl border border-[#e8eee8] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#173c2b]/5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tones[metric.color] || tones.green
          }`}
        >
          <Icon size={21} />
        </div>

        <span className="rounded-lg bg-[#f2f7f2] px-2 py-1 text-[10px] font-bold text-[#63816c]">
          Live data
        </span>
      </div>

      <p className="mt-5 text-[12px] font-medium text-[#7d8b80]">
        {metric.label}
      </p>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="break-all text-[29px] font-extrabold tracking-tight text-[#193b2a]">
          {metric.value}
        </span>
        <span className="text-[11px] font-semibold text-[#9aa69c]">
          {metric.unit}
        </span>
      </div>

      <p className="mt-2 text-[10px] text-[#9aa69c]">{metric.note}</p>
    </div>
  );
}

function ChartCard({ materials }) {
  const [period, setPeriod] = useState("7 days");

  const chartData = (() => {
    if (materials.length === 0) {
  return [];
}

    const days = period === "7 days" ? 7 : 30;
    const now = new Date();
    const result = [];

    for (let offset = days - 1; offset >= 0; offset--) {
      const dayDate = new Date(now);
      dayDate.setHours(0, 0, 0, 0);
      dayDate.setDate(dayDate.getDate() - offset);

      const nextDay = new Date(dayDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const items = materials.filter((item) => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date >= dayDate && date < nextDay;
      });

      const recycled = items
        .filter((item) =>
          String(item.status || "").toLowerCase().includes("recycled")
        )
        .reduce((sum, item) => sum + (Number(item.weightKg) || 0), 0);

      const reused = items
        .filter((item) =>
          String(item.category || "").toLowerCase().includes("reus")
        )
        .reduce((sum, item) => sum + (Number(item.weightKg) || 0), 0);

      const organic = items
  .filter((item) => {
    const category = String(item.category || "").toLowerCase();
    const status = String(item.status || "").toLowerCase();

    return (
      category.includes("biodegradable") ||
      category.includes("organic") ||
      status === "composted"
    );
  })
  .reduce(
    (sum, item) => sum + (Number(item.weightKg) || 0),
    0
  );

      result.push({
        day:
          days === 7
            ? dayDate.toLocaleDateString("en", { weekday: "short" })
            : dayDate.toLocaleDateString("en", {
                day: "numeric",
                month: "short",
              }),
        recycled,
        reused,
        organic,
      });
    }

    return result;
  })();

  const hasRecords = materials.some((item) => item.createdAt);

  return (
    <section className="rounded-2xl border border-[#e8eee8] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#244330]">
            Material recovery flow
          </h2>
          <p className="mt-1 text-[11px] text-[#96a298]">
            {hasRecords
              ? "Recorded material activity by date"
              : "Illustrative data until material records are added"}
          </p>
        </div>

        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-lg border border-[#e5ece5] bg-[#fbfdfb] px-3 py-2 text-[11px] font-semibold text-[#587060] outline-none focus:border-[#58a77a]"
        >
          <option>7 days</option>
          <option>30 days</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-5">
        {[
          ["Recycled", "#27895a"],
          ["Reused", "#70b8a0"],
          ["Organic", "#e1b56a"],
        ].map(([name, color]) => (
          <div
            key={name}
            className="flex items-center gap-2 text-[10px] font-semibold text-[#718075]"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {name}
          </div>
        ))}
      </div>

      <div className="mt-4 h-[235px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 3, left: -23, bottom: 0 }}
          >
            <defs>
              <linearGradient id="recycleFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#27895a" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#27895a" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="reuseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#70b8a0" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#70b8a0" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="organicFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e1b56a" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#e1b56a" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#edf2ed"
              vertical={false}
              strokeDasharray="3 4"
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9aa69c", fontSize: 10 }}
              dy={10}
              interval={period === "30 days" ? 4 : 0}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9aa69c", fontSize: 10 }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5ece5",
                fontSize: 11,
              }}
            />

            <Area
              type="monotone"
              dataKey="recycled"
              name="Recycled (kg)"
              stroke="#27895a"
              strokeWidth={2.5}
              fill="url(#recycleFill)"
            />

            <Area
              type="monotone"
              dataKey="reused"
              name="Reused (kg)"
              stroke="#70b8a0"
              strokeWidth={2.5}
              fill="url(#reuseFill)"
            />

            <Area
              type="monotone"
              dataKey="organic"
              name="Organic (kg)"
              stroke="#e1b56a"
              strokeWidth={2.5}
              fill="url(#organicFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f5faf5] p-3">
        <TrendingUp size={16} className="shrink-0 text-[#298355]" />
        <p className="text-[10px] leading-relaxed text-[#6c8272]">
          {materials.length
            ? "Chart values use saved record weights and dates. Categories and statuses determine the series."
            : "Add materials through the scanner or tracking page to populate the chart with recorded activity."}
        </p>
      </div>
    </section>
  );
}

function ActivityTable({ items, onViewAll }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e8eee8] bg-white">
      <div className="flex items-center justify-between border-b border-[#edf1ed] px-5 py-5">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#244330]">
            Recent material activity
          </h2>
          <p className="mt-1 text-[11px] text-[#96a298]">
            Latest saved material records
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="text-[11px] font-bold text-[#278354] hover:text-[#155b38]"
        >
          View all <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="bg-[#fafcfa] text-[10px] uppercase tracking-wider text-[#9ba79d]">
              <th className="px-5 py-3 font-bold">Material</th>
              <th className="px-4 py-3 font-bold">Category</th>
              <th className="px-4 py-3 font-bold">Weight</th>
              <th className="px-5 py-3 font-bold">Status</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf5ed] text-[#278354]">
                    <Package size={23} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#385442]">
                    No material records yet
                  </p>
                  <p className="mt-1 text-xs text-[#96a298]">
                    Scan an item and save it to see it here.
                  </p>
                </td>
              </tr>
            ) : (
              items.slice(0, 8).map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-[#f0f3f0] transition hover:bg-[#fbfdfb]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          colors[item.color] || colors.amber
                        }`}
                      >
                        <Package size={16} />
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-[#385442]">
                          {item.name}
                        </p>
                        <p className="mt-1 text-[9px] text-[#a0aaa2]">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-[10px] text-[#718075]">
                    {item.type}
                  </td>

                  <td className="px-4 py-4 text-[11px] font-semibold text-[#52695a]">
                    {item.weight}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-[9px] font-bold ${
                        colors[item.statusColor] || colors.amber
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WelcomeBanner({ onScan }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#174b33] p-6 text-white sm:p-8">
      <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border-[34px] border-white/[0.035]" />
      <div className="absolute right-24 top-20 h-40 w-40 rounded-full bg-[#53a777]/10 blur-2xl" />

      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold text-[#c3ead0]">
          <Sparkles size={13} />
          YOUR CIRCULARITY COMMAND CENTER
        </div>

        <h1 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight sm:text-[32px]">
          Turn today's waste into
          <br className="hidden sm:block" /> tomorrow's resources.
        </h1>

        <p className="mt-3 max-w-md text-[12px] leading-6 text-white/65">
          Scan materials, discover their next best use, and track their journey
          toward a circular future.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onScan}
            className="flex items-center gap-2 rounded-xl bg-[#a7e8b9] px-4 py-3 text-[12px] font-extrabold text-[#174b33] shadow-lg shadow-black/10 transition hover:bg-white"
          >
            <Cpu size={17} />
            Scan waste item <span>→</span>
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-[11px] font-medium text-white/80">
            <Globe2 size={16} />
            Circular economy mode
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-5 hidden h-52 w-52 items-center justify-center sm:flex lg:right-16">
        <div className="absolute h-44 w-44 rounded-full border border-white/10" />
        <div className="absolute h-32 w-32 rounded-full border border-dashed border-[#a7e8b9]/40" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
          <Leaf size={43} className="text-[#a7e8b9]" />
        </div>

        <div className="absolute right-1 top-8 rounded-xl border border-white/10 bg-[#235d40] p-3 shadow-xl">
          <Recycle size={21} className="text-[#a7e8b9]" />
        </div>

        <div className="absolute bottom-5 left-1 rounded-xl border border-white/10 bg-[#235d40] p-3 shadow-xl">
          <Sprout size={21} className="text-[#a7e8b9]" />
        </div>
      </div>
    </section>
  );
}

function SecondaryPage({ page, onBack }) {
  const pageDetails = {
    "Digital Twin": {
      icon: Boxes,
      title: "Digital Twin Explorer",
      description: "Explore material stocks, collection points, and processing stages.",
      next: "Live material records are available in the dashboard and tracking page.",
    },
    "AI Eco Coach": {
      icon: Bot,
      title: "Your AI Eco Coach",
      description: "Get practical reuse and recycling recommendations.",
      next: "AI-generated advice requires a connected AI service.",
    },
    "Impact & Rewards": {
      icon: Sprout,
      title: "Impact & Rewards",
      description: "Understand your progress toward verified recovery.",
      next: "Impact calculations should use verified weights and completed outcomes.",
    },
    "Collection Centers": {
      icon: MapPin,
      title: "Collection Centers",
      description: "Plan where your materials should go next.",
      next: "Collection center locations and live routing are not connected yet.",
    },
    "Reports & Analytics": {
      icon: FileText,
      title: "Reports & Analytics",
      description: "Review material records and environmental outcomes.",
      next: "Reporting can be expanded using the saved material records.",
    },
    Settings: {
      icon: Settings,
      title: "Workspace Settings",
      description: "Manage your EcoTwin workspace.",
      next: "Account settings and workspace preferences are not connected yet.",
    },
  };

  const detail = pageDetails[page] || {
    icon: Settings,
    title: page,
    description: "Manage your EcoTwin workspace.",
    next: "This section will be implemented in a future milestone.",
  };

  const Icon = detail.icon;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl border border-[#e5ece5] bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f5eb] text-[#218052]">
          <Icon size={30} />
        </div>

        <h1 className="mt-6 text-2xl font-extrabold text-[#1c412d]">
          {detail.title}
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#77867a]">
          {detail.description}
        </p>

        <div className="mt-6 rounded-xl bg-[#f3f8f3] p-4 text-xs leading-5 text-[#5d7865]">
          {detail.next}
        </div>

        <button
          onClick={onBack}
          className="mt-6 rounded-xl bg-[#176b48] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#105638]"
        >
          ← Back to overview
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [materials, setMaterials] = useState(() => getMaterials());

  const stats = useMaterialStats();

  useEffect(() => {
    const refreshMaterials = () => {
      setMaterials(getMaterials());
    };

    window.addEventListener("materialsUpdated", refreshMaterials);
    window.addEventListener("storage", refreshMaterials);

    refreshMaterials();

    return () => {
      window.removeEventListener("materialsUpdated", refreshMaterials);
      window.removeEventListener("storage", refreshMaterials);
    };
  }, []);

  const liveMetrics = [
    {
      label: "Materials Tracked",
      value: stats.total,
      unit: "items",
      icon: Recycle,
      color: "green",
      note: "Saved material records",
    },
    {
      label: "Items Identified",
      value: stats.total,
      unit: "items",
      icon: ScanIcon,
      color: "blue",
      note: "Items currently recorded",
    },
    {
      label: "Recycling Rate",
      value: `${stats.recyclingRate}`,
      unit: "%",
      icon: Sprout,
      color: "purple",
      note: "Records marked Recycled",
    },
    {
      label: "Pending Collection",
      value: stats.pending,
      unit: "items",
      icon: Truck,
      color: "orange",
      note: "Awaiting processing",
    },
  ];

  const recentActivity = materials
    .map((item) => ({
      id: item.id,
      name: item.name || "Unknown material",
      type: item.category || "Uncategorized",
      weight: `${Number(item.weightKg || 0).toFixed(2)} kg`,
      time: formatTime(item.createdAt),
      status: item.status || "Pending",
      color: getCategoryColor(item.category),
      statusColor: getStatusColor(item.status),
      createdAt: item.createdAt || "",
    }))
    .sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const filteredActivity = recentActivity.filter((item) =>
    `${item.name} ${item.type} ${item.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7f9f6] font-sans text-[#193b2a]">
      <Sidebar
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-[#e8eee8] bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#53705d] hover:bg-[#f0f5f0] lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <div className="truncate text-[13px] font-extrabold text-[#254330]">
                {active}
              </div>
              <div className="mt-1 hidden text-[10px] text-[#99a69b] sm:block">
                EcoTwin AI <span className="mx-1">/</span> Circular intelligence
                platform
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <label className="hidden h-9 w-52 items-center gap-2 rounded-xl border border-[#e7ede7] bg-[#f9fbf9] px-3 md:flex lg:w-64">
              <Search size={15} className="text-[#9ba99e]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search material activity..."
                className="w-full bg-transparent text-[11px] outline-none placeholder:text-[#a3aea5]"
              />
              <span className="rounded border border-[#e0e8e0] px-1 text-[9px] text-[#9aa79c]">
                /
              </span>
            </label>

            <div className="relative">
              <button
                aria-label="Notifications"
                onClick={() => setNotifications((value) => !value)}
                className="relative rounded-xl border border-[#e8eee8] p-2.5 text-[#6d8272] transition hover:bg-[#f4f8f4]"
              >
                <Bell size={17} />
                {stats.pending > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e28d4e] ring-2 ring-white" />
                )}
              </button>

              {notifications && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#e5ece5] bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Notifications</p>
                    <button
                      aria-label="Close notifications"
                      onClick={() => setNotifications(false)}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#6f8173]">
                    {stats.pending > 0
                      ? `${stats.pending} saved material record(s) are pending.`
                      : "There are no pending material records."}
                  </p>

                  <button
                    onClick={() => {
                      setNotifications(false);
                      setActive("Material Tracking");
                    }}
                    className="mt-3 text-xs font-bold text-[#278354]"
                  >
                    Open material tracking →
                  </button>
                </div>
              )}
            </div>

            <div className="hidden h-8 w-px bg-[#e9eee9] sm:block" />

            <button
              onClick={() => setActive("Settings")}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-[#f4f8f4]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f2e8] text-[11px] font-extrabold text-[#176b48]">
                EC
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-[11px] font-bold text-[#375441]">
                  Eco Admin
                </p>
                <p className="mt-0.5 text-[9px] text-[#9ba69c]">
                  Administrator
                </p>
              </div>

              <ChevronDown size={14} className="hidden text-[#9aa69b] sm:block" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
          

{active === "AI Waste Scanner" ? (
  <WasteScanner />
) : active === "Digital Twin" ? (
  <DigitalTwin />
) : active === "AI Eco Coach" ? (
  <EcoCoach />
) : active === "Material Tracking" ? (
  <MaterialTracking />

) : active === "Impact & Rewards" ? (
  <ImpactRewards />

  ) : active === "Reports & Analytics" ? (
  <ReportsAnalytics
    materials={materials}
    onBack={() => setActive("Overview")}
  />
) : active === "Settings" ? (
  <WorkspaceSettings
    onClearHistory={() => {
      if (
        window.confirm(
          "Delete all saved material records? This cannot be undone."
        )
      ) {
        localStorage.removeItem("ecotwin_materials");
        window.dispatchEvent(new Event("materialsUpdated"));
        setMaterials(getMaterials());
      }
    }}
  />

  ) : active === "Collection Centers" ? (
  <CollectionCenters />
  
) : active === "Overview" ? (
  

            <>
              <WelcomeBanner
                onScan={() => setActive("AI Waste Scanner")}
              />

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-extrabold tracking-tight text-[#21432f]">
                    Your sustainability overview
                  </h2>
                  <p className="mt-1 text-[11px] text-[#92a095]">
                    Live statistics from your saved material records.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-[#e6ece6] bg-white px-3 py-2 text-[10px] font-semibold text-[#708276]">
                  <span className="h-2 w-2 rounded-full bg-[#48a66d]" />
                  <Activity size={13} />
                  Saved records
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {liveMetrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">
                <ChartCard materials={materials} />

                <section className="rounded-2xl border border-[#e8eee8] bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-[15px] font-extrabold text-[#244330]">
                        Material composition
                      </h2>
                      <p className="mt-1 text-[11px] text-[#96a298]">
                        Based on saved material weights
                      </p>
                    </div>

                    <button
                      onClick={() => setActive("Digital Twin")}
                      aria-label="Explore digital twin"
                      className="rounded-lg p-2 text-[#8b9b8f] hover:bg-[#f2f7f2]"
                    >
                      <Boxes size={17} />
                    </button>
                  </div>

                  {(() => {
                    const categories = {};

                    materials.forEach((item) => {
                      const category = item.category || "Uncategorized";
                      const weight = Number(item.weightKg) || 0;
                      categories[category] =
                        (categories[category] || 0) + weight;
                    });

                    const entries = Object.entries(categories)
                      .sort((a, b) => b[1] - a[1]);

                    const totalWeight = entries.reduce(
                      (sum, [, weight]) => sum + weight,
                      0
                    );

                    const palette = [
                      "#288756",
                      "#d8aa5b",
                      "#6f9bdc",
                      "#a18bd3",
                      "#70b8a0",
                      "#d27c64",
                    ];

                    return entries.length ? (
                      <div className="mt-7 space-y-5">
                        {entries.slice(0, 6).map(([name, weight], index) => {
                          const percentage =
                            totalWeight > 0
                              ? (weight / totalWeight) * 100
                              : 0;
                          const color = palette[index % palette.length];

                          return (
                            <div key={name}>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#526a59]">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="truncate">{name}</span>
                                </div>

                                <div className="whitespace-nowrap text-[10px] font-bold text-[#607766]">
                                  {weight.toFixed(2)} kg{" "}
                                  <span className="ml-1 text-[#9ca89e]">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-[#f0f3f0]">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        <div className="rounded-xl bg-[#f5faf5] p-3 text-[11px] text-[#587060]">
                          Total recorded weight:{" "}
                          <strong>{totalWeight.toFixed(2)} kg</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-7 rounded-xl bg-[#f5faf5] px-4 py-10 text-center">
                        <Recycle
                          size={28}
                          className="mx-auto text-[#70a782]"
                        />
                        <p className="mt-3 text-sm font-bold text-[#385442]">
                          No composition data yet
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#96a298]">
                          Save materials with a category and weight to populate
                          this chart.
                        </p>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => setActive("Material Tracking")}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce9dd] py-3 text-[11px] font-bold text-[#28794d] transition hover:bg-[#f2f8f2]"
                  >
                    Manage materials <span>→</span>
                  </button>
                </section>
              </div>

              <ActivityTable
                items={filteredActivity}
                onViewAll={() => setActive("Material Tracking")}
              />

              <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[10px] text-[#a0aaa1]">
                <span>© 2026 EcoTwin AI · Built for a circular future</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  Metrics are calculated from saved local records
                </span>
              </footer>
            </>
          ) : (
            <SecondaryPage
              page={active}
              onBack={() => setActive("Overview")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
