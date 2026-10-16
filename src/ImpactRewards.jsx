
import { useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Leaf,
  Package,
  Recycle,
  Sprout,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";

import {
  getMaterials,
  getImpactSummary,
} from "./utils/materialTracker.js";

function StatCard({ icon: Icon, label, value, unit, description }) {
  return (
    <div className="rounded-2xl border border-[#e5ece5] bg-white p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f5eb] text-[#218052]">
        <Icon size={22} />
      </div>
      <p className="mt-5 text-xs font-medium text-[#7d8b80]">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-[#193b2a]">
        {value}
        {unit && <span className="ml-1 text-sm">{unit}</span>}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#96a298]">
        {description}
      </p>
    </div>
  );
}

export default function ImpactRewards() {
  const [materials, setMaterials] = useState(() => getMaterials());
  const [summary, setSummary] = useState(() => getImpactSummary());

  useEffect(() => {
    const refresh = () => {
      setMaterials(getMaterials());
      setSummary(getImpactSummary());
    };

    window.addEventListener("materialsUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("materialsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const completed = materials.filter((item) =>
    ["recycled", "reused", "composted"].includes(
      String(item.status || "").toLowerCase()
    )
  );

  const pending = materials.length - completed.length;
  const totalWeight = materials.reduce(
    (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
    0
  );

  const recoveredWeight = completed.reduce(
    (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
    0
  );

  const recoveryRate =
    materials.length > 0
      ? Math.round((completed.length / materials.length) * 100)
      : 0;

  const ecoPoints =
    typeof summary?.ecoPoints === "number"
      ? summary.ecoPoints
      : completed.length * 10;

  const nextMilestone = Math.ceil((ecoPoints + 1) / 100) * 100;
  const milestoneProgress = ecoPoints % 100;

  const badges = [
    {
      title: "First Step",
      description: "Save your first material record.",
      unlocked: materials.length >= 1,
      icon: Package,
    },
    {
      title: "Circular Starter",
      description: "Complete 5 recovery actions.",
      unlocked: completed.length >= 5,
      icon: Recycle,
    },
    {
      title: "Eco Champion",
      description: "Complete 20 recovery actions.",
      unlocked: completed.length >= 20,
      icon: Trophy,
    },
    {
      title: "Century Club",
      description: "Earn 100 eco points.",
      unlocked: ecoPoints >= 100,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#174b33] p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[28px] border-white/5" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#c3ead0]">
            <Sprout size={15} />
            YOUR SUSTAINABILITY JOURNEY
          </div>

          <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">
            Every action counts.
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">
            Track your recorded recovery actions, earn demo eco points,
            and unlock milestones as your material records grow.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-white/60">Eco points</p>
              <p className="mt-1 text-2xl font-extrabold">
                {ecoPoints}
                <span className="ml-2 text-xs font-medium text-[#b7efc8]">
                  points
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs text-white/60">Recovery rate</p>
              <p className="mt-1 text-2xl font-extrabold">
                {recoveryRate}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Materials recorded"
          value={materials.length}
          description="Saved material records"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed actions"
          value={completed.length}
          description="Marked Recycled, Reused, or Composted"
        />
        <StatCard
          icon={Leaf}
          label="Recovered weight"
          value={recoveredWeight.toFixed(2)}
          unit="kg"
          description="Weight of records marked completed"
        />
        <StatCard
          icon={Target}
          label="Awaiting recovery"
          value={pending}
          description="Records not yet marked completed"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#e5ece5] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1dc] text-[#bd8130]">
              <TrendingUp size={21} />
            </div>
            <div>
              <h2 className="font-extrabold text-[#244330]">
                Next points milestone
              </h2>
              <p className="mt-1 text-xs text-[#96a298]">
                Demo reward progression
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-extrabold text-[#193b2a]">
                {ecoPoints}
                <span className="ml-1 text-sm font-semibold text-[#8b9b8f]">
                  points
                </span>
              </p>
              <p className="mt-1 text-xs text-[#8b9b8f]">
                {Math.max(0, nextMilestone - ecoPoints)} points to the next
                milestone
              </p>
            </div>
            <span className="text-sm font-bold text-[#278354]">
              {milestoneProgress} / 100
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#edf3ed]">
            <div
              className="h-full rounded-full bg-[#38a169] transition-all duration-500"
              style={{ width: `${milestoneProgress}%` }}
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-[#849287]">
            Current demo rule: 10 points per completed recovery record.
            Points are illustrative and are not monetary rewards.
          </p>
        </section>

        <section className="rounded-2xl border border-[#e5ece5] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f5eb] text-[#218052]">
              <Recycle size={21} />
            </div>
            <div>
              <h2 className="font-extrabold text-[#244330]">
                Recovery summary
              </h2>
              <p className="mt-1 text-xs text-[#96a298]">
                Calculated from saved records
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-[#64776a]">Completed recovery</span>
                <strong className="text-[#278354]">
                  {completed.length} items
                </strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#edf3ed]">
                <div
                  className="h-full rounded-full bg-[#38a169]"
                  style={{ width: `${recoveryRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-[#64776a]">Awaiting recovery</span>
                <strong className="text-[#bd8130]">{pending} items</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#edf3ed]">
                <div
                  className="h-full rounded-full bg-[#e2b45d]"
                  style={{
                    width:
                      materials.length > 0
                        ? `${(pending / materials.length) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-[#f5faf5] p-4">
              <p className="text-xs text-[#718477]">Total tracked weight</p>
              <p className="mt-1 text-xl font-extrabold text-[#244330]">
                {totalWeight.toFixed(2)} kg
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#e5ece5] bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eaff] text-[#8261c7]">
            <Award size={21} />
          </div>
          <div>
            <h2 className="font-extrabold text-[#244330]">
              Achievement badges
            </h2>
            <p className="mt-1 text-xs text-[#96a298]">
              Earn milestones by recording your progress
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {badges.map((badge) => {
            const Icon = badge.icon;

            return (
              <div
                key={badge.title}
                className={`rounded-2xl border p-5 ${
                  badge.unlocked
                    ? "border-[#cfe8d4] bg-[#f4fbf5]"
                    : "border-[#e8eee8] bg-[#fafcfa]"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    badge.unlocked
                      ? "bg-[#dff2e3] text-[#278354]"
                      : "bg-[#edf0ed] text-[#a2aca4]"
                  }`}
                >
                  <Icon size={24} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#35513e]">
                    {badge.title}
                  </h3>
                  {badge.unlocked && (
                    <CheckCircle2 size={15} className="text-[#278354]" />
                  )}
                </div>

                <p className="mt-2 min-h-10 text-xs leading-5 text-[#829084]">
                  {badge.description}
                </p>

                <p
                  className={`mt-3 text-[10px] font-bold ${
                    badge.unlocked ? "text-[#278354]" : "text-[#a0aaa1]"
                  }`}
                >
                  {badge.unlocked ? "UNLOCKED" : "LOCKED"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs leading-5 text-[#96a298]">
        Environmental impact is not independently verified. This page reports
        recorded weights and demo points only; it does not estimate carbon
        savings or provide redeemable rewards.
      </p>
    </div>
  );
}
