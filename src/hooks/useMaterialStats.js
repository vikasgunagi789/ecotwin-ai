
import { useEffect, useState } from "react";
import { getMaterialStats } from "../utils/materialTracker";

export default function useMaterialStats() {
  const [stats, setStats] = useState(() => getMaterialStats());

  useEffect(() => {
    const refresh = () => {
      setStats(getMaterialStats());
    };

    window.addEventListener("materialsUpdated", refresh);
    window.addEventListener("storage", refresh);

    refresh();

    return () => {
      window.removeEventListener("materialsUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return stats;
}
