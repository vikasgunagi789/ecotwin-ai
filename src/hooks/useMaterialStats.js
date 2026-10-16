
import { useCallback, useEffect, useState } from "react";
import { getMaterials, getMaterialStats } from "../utils/materialTracker";

export default function useMaterialStats() {
  const [materials, setMaterials] = useState(() => getMaterials());
  const [stats, setStats] = useState(() => getMaterialStats());

  const refresh = useCallback(() => {
    setMaterials(getMaterials());
    setStats(getMaterialStats());
  }, []);

  useEffect(() => {
    window.addEventListener("materialsUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("materialsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { materials, stats, refresh };
}
