import { useEffect, useState } from "react";

// Tracks connectivity so screens can say what still works offline instead of
// silently failing (GPS keeps recording without a signal — only the map tiles
// and the food/video lookups need the network).
export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine !== false
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}
