import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Leaf,
  Recycle,
  Lightbulb,
  TrendingUp,
  Droplets,
  Zap,
  CheckCircle2,
  Target,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Trash2,
  Sprout,
} from "lucide-react";
import { getMaterials } from "./utils/materialTracker.js";

const COACH_TIPS = [
  {
    title: "Separate waste at the source",
    description:
      "Keep wet, dry, and hazardous waste in separate containers to improve recovery and reduce contamination.",
    icon: Recycle,
    color: "emerald",
    category: "General",
  },
  {
    title: "Give materials a second life",
    description:
      "Before throwing something away, consider whether it can be repaired, reused, donated, or repurposed.",
    icon: RefreshCw,
    color: "blue",
    category: "Reuse",
  },
  {
    title: "Reduce single-use plastic",
    description:
      "Choose reusable bottles, bags, and food containers to reduce the amount of disposable waste you generate.",
    icon: Droplets,
    color: "cyan",
    category: "Plastic",
  },
  {
    title: "Recycle paper correctly",
    description:
      "Keep paper and cardboard clean and dry. Remove food-soiled packaging from your recycling stream.",
    icon: Leaf,
    color: "amber",
    category: "Paper",
  },
  {
    title: "Compost organic waste",
    description:
      "Fruit peels, vegetable scraps, and suitable garden waste can become compost instead of going to landfill.",
    icon: Sprout,
    color: "lime",
    category: "Organic",
  },
  {
    title: "Track your progress",
    description:
      "Record the materials you recover and review your results regularly to identify opportunities for improvement.",
    icon: TrendingUp,
    color: "violet",
    category: "General",
  },
];

function getCategory(material) {
  return String(material.category || material.type || "Other").toLowerCase();
}

function getStatus(material) {
  return String(material.status || "Pending").toLowerCase();
}

function getMaterialWeight(material) {
  const weight = Number(material.weightKg);
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

function isRecovered(material) {
  return /recycl|reus|compost|recover|completed/.test(getStatus(material));
}

function makeRecommendations(materials) {
  if (materials.length === 0) {
    return [
      {
        title: "Start your sustainability journey",
        description:
          "Use AI Waste Scanner to identify an item and save it to Material Tracking. Your coach can then give advice based on your actual records.",
        priority: "Start here",
        icon: Target,
      },
      {
        title: "Set up waste separation",
        description:
          "Prepare separate containers for recyclable materials, organic waste, and general waste.",
        priority: "Easy win",
        icon: Recycle,
      },
      {
        title: "Try reusing before recycling",
        description:
          "Check whether an item can be reused or repaired before sending it for recycling.",
        priority: "Daily habit",
        icon: RefreshCw,
      },
    ];
  }

  const categoryCounts = {};
  materials.forEach((material) => {
    const category = getCategory(material);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const topCategory = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const pending = materials.filter((material) => !isRecovered(material));
  const recommendations = [];

  if (pending.length > 0) {
    recommendations.push({
      title: "Review materials awaiting recovery",
      description: `${pending.length} of your recorded items are not marked as recovered. Check Material Tracking and update their status when their next step is confirmed.`,
      priority: "High priority",
      icon: RefreshCw,
    });
  }

  if (topCategory) {
    const categoryName =
      topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1);

    recommendations.push({
      title: `Focus on your ${categoryName} waste`,
      description: `${topCategory[1]} recorded item${topCategory[1] === 1 ? "" : "s"} belong to this category, making it a useful place to look for reduction and reuse opportunities.`,
      priority: "Based on your records",
      icon: Target,
    });
  }

  const organic = materials.filter((material) =>
    /organic|food|garden|biodegrad/.test(getCategory(material))
  );

  if (organic.length > 0) {
    recommendations.push({
      title: "Explore composting",
      description:
        "Your records include organic materials. Where local facilities accept them, consider composting suitable food scraps and garden waste.",
      priority: "Reduce landfill",
      icon: Sprout,
    });
  }

  const plastic = materials.filter((material) =>
    /plastic|bottle|packaging/.test(getCategory(material))
  );

  if (plastic.length > 0) {
    recommendations.push({
      title: "Look for plastic reduction opportunities",
      description:
        "Your records include plastic-related items. Where practical, replace disposable products with durable, reusable alternatives.",
      priority: "Prevention",
      icon: Droplets,
    });
  }

  recommendations.push({
    title: "Keep your records up to date",
    description:
      "Update material statuses when items are actually reused, recycled, or composted. Accurate records make your dashboard more useful.",
    priority: "Good practice",
    icon: CheckCircle2,
  });

  return recommendations.slice(0, 4);
}

export default function EcoCoach() {
  const [materials, setMaterials] = useState(() => getMaterials() || []);
  const [activeTab, setActiveTab] = useState("For You");

  useEffect(() => {
    const refreshMaterials = () => {
      setMaterials(getMaterials() || []);
    };

    window.addEventListener("materialsUpdated", refreshMaterials);
    window.addEventListener("storage", refreshMaterials);

    refreshMaterials();

    return () => {
      window.removeEventListener("materialsUpdated", refreshMaterials);
      window.removeEventListener("storage", refreshMaterials);
    };
  }, []);

  const stats = useMemo(() => {
    const total = materials.length;
    const recovered = materials.filter(isRecovered).length;
    const pending = total - recovered;
    const totalWeight = materials.reduce(
      (sum, material) => sum + getMaterialWeight(material),
      0
    );

    return {
      total,
      recovered,
      pending,
      totalWeight,
      recoveryRate: total ? Math.round((recovered / total) * 100) : 0,
    };
  }, [materials]);

  const recommendations = useMemo(
    () => makeRecommendations(materials),
    [materials]
  );

  const visibleTips = useMemo(() => {
    if (activeTab === "All Tips") return COACH_TIPS;
    if (activeTab === "Reduce Waste") {
      return COACH_TIPS.filter((tip) =>
        ["Plastic", "Paper", "Organic", "General"].includes(tip.category)
      );
    }
    if (activeTab === "Reuse & Recycle") {
      return COACH_TIPS.filter((tip) =>
        ["Reuse", "Paper", "General"].includes(tip.category)
      );
    }
    return COACH_TIPS.slice(0, 3);
  }, [activeTab]);

  return (
    <div className="space-y-7 pb-10 text-slate-800">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-7 text-white shadow-xl sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative grid gap-8 md:grid-cols-[1.4fr_0.6fr] md:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-emerald-50">
              <Sparkles size={15} />
              Your sustainability assistant
            </div>

            <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Small actions.
              <br />
              <span className="text-emerald-300">A greener tomorrow.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/85 sm:text-base">
              Turn your material records into practical sustainability actions.
              Discover ways to reduce waste, improve recovery, and build better
              everyday habits.
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("eco-recommendations")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              View my recommendations
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-inner sm:h-52 sm:w-52">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-400/20 sm:h-40 sm:w-40">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-300/20 sm:h-32 sm:w-32">
                <Leaf size={70} strokeWidth={1.2} className="text-emerald-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Your eco snapshot</h2>
          <p className="mt-1 text-sm text-slate-500">
            Calculated from your current Material Tracking records.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Items recorded",
              value: stats.total,
              icon: Trash2,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Items recovered",
              value: stats.recovered,
              icon: Recycle,
              color: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Awaiting recovery",
              value: stats.pending,
              icon: Target,
              color: "bg-amber-50 text-amber-700",
            },
            {
              label: "Recorded weight",
              value: `${stats.totalWeight.toFixed(2)} kg`,
              icon: Sprout,
              color: "bg-violet-50 text-violet-700",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{stat.label}</span>
                  <div className={`rounded-xl p-2.5 ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recovery progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Material recovery progress</h2>
            <p className="mt-1 text-sm text-slate-500">
              Based on items currently marked as recovered.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.recoveryRate}%</p>
              <p className="text-xs text-slate-500">Recovery rate</p>
            </div>
          </div>
        </div>

        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={stats.recoveryRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Material recovery rate"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
            style={{ width: `${stats.recoveryRate}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-500">
          {stats.total === 0
            ? "Add your first material to start tracking your recovery progress."
            : stats.recoveryRate === 100
              ? "Great work! All recorded items are currently marked as recovered."
              : `${stats.pending} item${stats.pending === 1 ? "" : "s"} still need attention or a status update.`}
        </p>
      </section>

      {/* Recommendations */}
      <section id="eco-recommendations" className="scroll-mt-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Your personalized action plan</h2>
            <p className="mt-1 text-sm text-slate-500">
              Suggestions generated from your saved material categories and statuses.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((recommendation, index) => {
            const Icon = recommendation.icon;
            return (
              <article
                key={recommendation.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
                    <Icon size={23} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Action {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {recommendation.priority}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900">
                      {recommendation.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Tips library */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold">Eco knowledge hub</h2>
          <p className="mt-1 text-sm text-slate-500">
            Simple practices you can apply in your daily routine.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {["For You", "All Tips", "Reduce Waste", "Reuse & Recycle"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <article
                key={tip.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={22} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {tip.category}
                </span>
                <h3 className="mt-2 font-bold">{tip.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {tip.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Important note */}
      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <Lightbulb className="mt-0.5 shrink-0" size={20} />
        <p>
          <strong>About these recommendations:</strong> This version uses
          rule-based logic and your locally saved records; it does not call a
          live generative AI service. Environmental outcomes are not estimated
          unless you add a validated calculation method.
        </p>
      </div>
    </div>
  );
}
