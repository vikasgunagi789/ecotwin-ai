
const STORAGE_KEY = "ecotwin_materials";

function readMaterials() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read material records:", error);
    return [];
  }
}

function notifyMaterialsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("materialsUpdated"));
  }
}

function saveMaterials(materials) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    notifyMaterialsUpdated();
  } catch (error) {
    console.error("Could not save material records:", error);
    throw new Error(
      "Could not save material records. Check your browser storage settings."
    );
  }
}

function normalizeStatus(status) {
  return String(status || "Pending").trim().toLowerCase();
}

function isCompleted(status) {
  return ["reused", "recycled", "composted"].includes(
    normalizeStatus(status)
  );
}

function normalizeWeight(weightKg) {
  const weight = Number(weightKg);
  return Number.isFinite(weight) ? Math.max(0, weight) : 0;
}

export function getMaterials() {
  return readMaterials();
}

export function addMaterial(material = {}) {
  const materials = readMaterials();

  const record = {
    ...material,
    id:
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: material.name || material.item || "Unknown material",
    category: material.category || "recyclable",
    recommendation: material.recommendation || "",
    status: material.status || "Pending",
    weightKg: normalizeWeight(material.weightKg),
    createdAt: new Date().toISOString(),
  };

  saveMaterials([record, ...materials]);
  return record;
}

export function updateMaterial(id, updates = {}) {
  const materials = readMaterials();

  const index = materials.findIndex(
    (item) => String(item.id) === String(id)
  );

  if (index === -1) return null;

  const updated = materials.map((item, itemIndex) => {
    if (itemIndex !== index) return item;

    const next = { ...item, ...updates, id: item.id };

    if ("weightKg" in updates) {
      next.weightKg = normalizeWeight(updates.weightKg);
    }

    return next;
  });

  saveMaterials(updated);

  return updated[index];
}

export function updateMaterialStatus(id, status) {
  return updateMaterial(id, { status });
}

export function deleteMaterial(id) {
  const materials = readMaterials();

  const updated = materials.filter(
    (item) => String(item.id) !== String(id)
  );

  if (updated.length !== materials.length) {
    saveMaterials(updated);
  }

  return updated;
}

export function getMaterialStats() {
  const materials = readMaterials();

  const total = materials.length;

  const pending = materials.filter(
    (item) => normalizeStatus(item.status) === "pending"
  ).length;

  const recycled = materials.filter(
    (item) => normalizeStatus(item.status) === "recycled"
  ).length;

  const reused = materials.filter(
    (item) => normalizeStatus(item.status) === "reused"
  ).length;

  const composted = materials.filter(
    (item) => normalizeStatus(item.status) === "composted"
  ).length;

  const processing = materials.filter(
    (item) => normalizeStatus(item.status) === "processing"
  ).length;

  const totalWeight = materials.reduce(
    (sum, item) => sum + normalizeWeight(item.weightKg),
    0
  );

  return {
    total,
    pending,
    recycled,
    reused,
    composted,
    completedActions: reused + recycled + composted,
    processing,
    totalWeight: Number(totalWeight.toFixed(2)),
    recyclingRate: total
      ? Math.round((recycled / total) * 100)
      : 0,
  };
}

export function getImpactSummary() {
  const materials = readMaterials();

  const completedActions = materials.filter((item) =>
    isCompleted(item.status)
  ).length;

  const pending = materials.filter(
    (item) => normalizeStatus(item.status) === "pending"
  ).length;

  const trackedWeightKg = materials.reduce(
    (sum, item) => sum + normalizeWeight(item.weightKg),
    0
  );

  return {
    totalScanned: materials.length,
    completedActions,
    pending,
    ecoPoints: completedActions * 10,
    trackedWeightKg: Number(trackedWeightKg.toFixed(2)),
  };
}
