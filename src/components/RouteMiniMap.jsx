import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Static, non-interactive OpenStreetMap showing a saved run's route,
// with green start / red finish markers. `route` = [[lat,lng], ...].
export default function RouteMiniMap({ route }) {
  const el = useRef(null);
  useEffect(() => {
    if (!el.current || !route?.length) return;
    const map = L.map(el.current, {
      zoomControl: false, attributionControl: false, dragging: false,
      scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false,
      keyboard: false, touchZoom: false, tap: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    const latlngs = route.map((p) => [p[0], p[1]]);
    const line = L.polyline(latlngs, { color: "#4C8DFF", weight: 4 }).addTo(map);
    L.circleMarker(latlngs[0], { radius: 5, color: "#fff", weight: 2, fillColor: "#35C26B", fillOpacity: 1 }).addTo(map);
    L.circleMarker(latlngs[latlngs.length - 1], { radius: 5, color: "#fff", weight: 2, fillColor: "#FF5A5F", fillOpacity: 1 }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [18, 18] });
    setTimeout(() => map.invalidateSize(), 90);
    return () => map.remove();
  }, [route]);
  return <div className="run-mini-map" ref={el} />;
}
