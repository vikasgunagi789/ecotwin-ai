
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

function isCompleted(status) {
  return ["reused", "recycled", "composted"].includes(
    String(status || "").trim().toLowerCase()
  );
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
    name: material.name || "Unknown material",
    category: material.category || "recyclable",
    recommendation: material.recommendation || "",
    status: material.status || "Pending",
    weightKg: Math.max(0, Number(material.weightKg) || 0),
    createdAt: new Date().toISOString(),
  };

  saveMaterials([record, ...materials]);
  return record;
}

export function updateMaterial(id, updates = {}) {
  const materials = readMaterials();
  const exists = materials.some(
    (item) => String(item.id) === String(id)
  );

  if (!exists) return null;

  const updated = materials.map((item) =>
    String(item.id) === String(id)
      ? { ...item, ...updates, id: item.id }
      : item
  );

  saveMaterials(updated);
  return updated.find((item) => String(item.id) === String(id)) ?? null;
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
    (item) =>
      String(item.status || "Pending").trim().toLowerCase() === "pending"
  ).length;

  const recycled = materials.filter(
    (item) =>
      String(item.status || "").trim().toLowerCase() === "recycled"
  ).length;

  const reused = materials.filter(
    (item) =>
      String(item.status || "").trim().toLowerCase() === "reused"
  ).length;

  const composted = materials.filter(
    (item) =>
      String(item.status || "").trim().toLowerCase() === "composted"
  ).length;

  const processing = materials.filter(
    (item) =>
      String(item.status || "").trim().toLowerCase() === "processing"
  ).length;

  const totalWeight = materials.reduce(
    (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
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
    (item) =>
      String(item.status || "Pending").trim().toLowerCase() === "pending"
  ).length;

  const trackedWeightKg = materials.reduce(
    (sum, item) => sum + Math.max(0, Number(item.weightKg) || 0),
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
