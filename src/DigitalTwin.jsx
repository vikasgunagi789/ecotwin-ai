
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Recycle,
  Leaf,
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { getMaterials } from "./utils/materialTracker.js";

const stages = [
  {
    id: "pending",
    title: "Collection",
    description: "Materials awaiting their next action",
    icon: Truck,
    color: "#d49a38",
  },
  {
    id: "processing",
    title: "Sorting & processing",
    description: "Materials being prepared for recovery",
    icon: RefreshCw,
    color: "#5689cb",
  },
  {
    id: "recovery",
    title: "Recovered",
    description: "Materials marked reused, recycled or composted",
    icon: Recycle,
    color: "#26915a",
  },
];

function getStage(item) {
  const status = String(item.status || "pending").toLowerCase();

  if (
    /recycl|reus|compost|completed|recovered/.test(status)
  ) {
    return "recovery";
  }

  if (/process|progress|sorting|collected/.test(status)) {
    return "processing";
  }

  return "pending";
}

function formatWeight(value) {
  return `${value.toFixed(2)} kg`;
}

export default function DigitalTwin() {
  const [materials, setMaterials] = useState(() => getMaterials());
  const [scenario, setScenario] = useState(20);

  useEffect(() => {
    const refresh = () => setMaterials(getMaterials());

    window.addEventListener("materialsUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("materialsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const data = useMemo(() => {
    const groups = {
      pending: [],
      processing: [],
      recovery: [],
    };

    materials.forEach((item) => {
      groups[getStage(item)].push(item);
    });

    const totalWeight = materials.reduce(
      (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
      0
    );

    const recoveredWeight = groups.recovery.reduce(
      (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
      0
    );

    const pendingWeight = groups.pending.reduce(
      (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
      0
    );

    return {
      groups,
      totalItems: materials.length,
      totalWeight,
      recoveredWeight,
      pendingWeight,
      recoveryRate:
        totalWeight > 0 ? (recoveredWeight / totalWeight) * 100 : 0,
    };
  }, [materials]);

  const projectedRecovery = data.totalWeight * (scenario / 100);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] text-[#278354]">
          <Activity size={14} />
          Live material model
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#193b2a] sm:text-3xl">
          Digital Twin Explorer
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#78877d]">
          Explore the lifecycle of your recorded materials. Updates from
          Material Tracking appear here automatically.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Tracked materials",
            value: data.totalItems,
            unit: "items",
            icon: Package,
          },
          {
            label: "Recorded weight",
            value: formatWeight(data.totalWeight),
            unit: "",
            icon: Boxes,
          },
          {
            label: "Recovered weight",
            value: formatWeight(data.recoveredWeight),
            unit: "",
            icon: Recycle,
          },
          {
            label: "Awaiting action",
            value: data.groups.pending.length,
            unit: "items",
            icon: Clock3,
          },
        ].map(({ label, value, unit, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-[#e5ece5] bg-white p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5ed] text-[#278354]">
              <Icon size={20} />
            </div>
            <p className="mt-4 text-xs text-[#7d8b80]">{label}</p>
            <p className="mt-1 break-words text-2xl font-extrabold text-[#193b2a]">
              {value}{" "}
              {unit && (
                <span className="text-xs font-semibold text-[#96a298]">
                  {unit}
                </span>
              )}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[#e5ece5] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#254330]">
              Material lifecycle
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#96a298]">
              Current state derived from saved record statuses
            </p>
          </div>
          <span className="rounded-lg bg-[#eaf5ed] px-3 py-2 text-[10px] font-bold text-[#278354]">
            {data.totalItems} records
          </span>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {stages.map((stage, index) => {
            const items = data.groups[stage.id];
            const Icon = stage.icon;
            const weight = items.reduce(
              (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
              0
            );

            return (
              <div key={stage.id} className="relative">
                <article className="h-full rounded-2xl border border-[#e7eee7] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${stage.color}18`,
                        color: stage.color,
                      }}
                    >
                      <Icon size={21} />
                    </div>
                    <span className="text-2xl font-extrabold text-[#254330]">
                      {items.length}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-extrabold text-[#355441]">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-[#96a298]">
                    {stage.description}
                  </p>

                  <div className="mt-4 rounded-xl bg-[#f6f9f6] p-3">
                    <p className="text-[10px] text-[#8b998e]">
                      Recorded weight
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#355441]">
                      {formatWeight(weight)}
                    </p>
                  </div>

                  {items.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-xs text-[#637768]"
                        >
                          <Package
                            size={14}
                            className="shrink-0"
                            style={{ color: stage.color }}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {item.name || "Unnamed material"}
                          </span>
                          <span className="shrink-0 text-[10px]">
                            {Number(item.weightKg || 0).toFixed(2)} kg
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[10px] text-[#96a298]">
                          +{items.length - 3} more records
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[#a0aaa2]">
                      No records at this stage yet.
                    </p>
                  )}
                </article>

                {index < stages.length - 1 && (
                  <div className="hidden absolute -right-4 top-1/2 z-10 -translate-y-1/2 lg:block">
                    <ArrowRight size={18} className="text-[#9bb4a0]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-5 flex items-start gap-2 rounded-xl bg-[#f4f9f4] p-3 text-[11px] leading-5 text-[#6d8272]">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          Lifecycle stages are inferred from record statuses, not live sensors
          or physical facility monitoring.
        </p>
      </section>

      <section className="rounded-2xl border border-[#dcebdd] bg-[#edf7ef] p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Leaf size={20} className="text-[#278354]" />
          <h2 className="text-base font-extrabold text-[#254330]">
            Recovery scenario simulator
          </h2>
        </div>

        <p className="mt-2 text-xs leading-6 text-[#6d8272]">
          Explore a hypothetical recovery target for your currently tracked
          weight. This simulation does not change your saved records.
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <label
            htmlFor="recovery-target"
            className="text-xs font-bold text-[#42634c]"
          >
            Target recovery rate
          </label>
          <span className="text-lg font-extrabold text-[#23794a]">
            {scenario}%
          </span>
        </div>

        <input
          id="recovery-target"
          type="range"
          min="0"
          max="100"
          step="5"
          value={scenario}
          onChange={(event) => setScenario(Number(event.target.value))}
          className="mt-4 w-full accent-[#278354]"
        />

        <div className="mt-2 flex justify-between text-[10px] text-[#849a89]">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/80 p-4">
            <p className="text-[10px] text-[#849a89]">Current recovery</p>
            <p className="mt-1 text-lg font-extrabold text-[#254330]">
              {data.recoveryRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl bg-white/80 p-4">
            <p className="text-[10px] text-[#849a89]">Hypothetical target</p>
            <p className="mt-1 text-lg font-extrabold text-[#254330]">
              {scenario}%
            </p>
          </div>
          <div className="rounded-xl bg-white/80 p-4">
            <p className="text-[10px] text-[#849a89]">Weight at target</p>
            <p className="mt-1 text-lg font-extrabold text-[#254330]">
              {formatWeight(projectedRecovery)}
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-[10px] leading-5 text-[#718a77]">
          <CheckCircle2 size={14} />
          Simulation only — no environmental savings are claimed or recorded.
        </p>
      </section>
    </div>
  );
}
