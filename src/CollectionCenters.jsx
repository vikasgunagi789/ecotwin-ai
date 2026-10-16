import { useMemo, useState } from "react";
import {
  MapPin,
  Search,
  Recycle,
  Clock,
  Navigation,
  Leaf,
  Filter,
  PackageCheck,
} from "lucide-react";

const centers = [
  {
    id: 1,
    name: "Plastic Recycling Center",
    address: "Enter your local plastic recycling center address",
    materials: ["Plastic"],
    hours: "Verify opening hours",
    type: "Plastic",
  },
  {
    id: 2,
    name: "Paper and Cardboard Collection",
    address: "Enter your local paper collection point address",
    materials: ["Paper", "Cardboard"],
    hours: "Verify opening hours",
    type: "Paper",
  },
  {
    id: 3,
    name: "E-Waste Collection Point",
    address: "Enter your authorized e-waste collection point address",
    materials: ["Electronics", "Batteries"],
    hours: "Verify opening hours",
    type: "E-Waste",
  },
  {
    id: 4,
    name: "Metal and Glass Recycling",
    address: "Enter your local metal and glass recycling address",
    materials: ["Metal", "Glass"],
    hours: "Verify opening hours",
    type: "Metal & Glass",
  },
];

const filters = [
  "All",
  "Plastic",
  "Paper",
  "E-Waste",
  "Metal & Glass",
];

export default function CollectionCenters() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredCenters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return centers.filter((center) => {
      const matchesFilter =
        filter === "All" || center.type === filter;

      const matchesSearch =
        !query ||
        center.name.toLowerCase().includes(query) ||
        center.address.toLowerCase().includes(query) ||
        center.materials.some((material) =>
          material.toLowerCase().includes(query)
        );

      return matchesFilter && matchesSearch;
    });
  }, [search, filter]);

  const openDirections = (center) => {
    const destination = encodeURIComponent(
      `${center.name}, ${center.address}`
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${destination}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-green-600 to-teal-500 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Recycle size={28} />
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-100">
            Sustainable Waste Management
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Collection Centers
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
            Find suitable collection points for recyclable
            materials and explore disposal options for your waste.
          </p>
        </div>

        <Leaf
          className="absolute -right-4 -bottom-8 text-white/10"
          size={180}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Directory entries</p>
              <p className="text-2xl font-bold">{centers.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Recycle size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Material categories</p>
              <p className="text-2xl font-bold">{filters.length - 1}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <PackageCheck size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Verified locations</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Find a collection point</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search the sample directory by material or center name.
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search plastic, paper, electronics..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={18} className="shrink-0 text-slate-400" />

          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Available directory entries</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredCenters.length} matching entries
          </p>
        </div>
      </div>

      {filteredCenters.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredCenters.map((center) => (
            <article
              key={center.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Recycle size={25} />
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Sample entry
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold">{center.name}</h3>

              <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                <MapPin size={18} className="mt-0.5 shrink-0" />
                <span>{center.address}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Clock size={17} />
                <span>{center.hours}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {center.materials.map((material) => (
                  <span
                    key={material}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"
                  >
                    {material}
                  </span>
                ))}
              </div>

              <button
                onClick={() => openDirections(center)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                <Navigation size={18} />
                Search on Google Maps
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Search className="mx-auto text-slate-400" size={36} />
          <h3 className="mt-4 text-lg font-semibold">
            No matching entries
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Try another search term or select a different material.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilter("All");
            }}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            Clear filters
          </button>
        </div>
      )}

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <strong>Important:</strong> These are demonstration entries, not
        verified real facilities. Replace the sample names and addresses
        with confirmed local collection points before relying on the
        directory. Google Maps searches are based on the entry text.
      </p>
    </div>
  );
}
