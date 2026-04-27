import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker assets when bundling with Vite.
export function initLeafletDefaultIcon() {
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
}

export function coloredDotIcon(color: string) {
  const html = `<div style="
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: ${color};
    border: 2px solid rgba(255,255,255,0.85);
    box-shadow: 0 6px 18px rgba(0,0,0,0.35);
  "></div>`;
  return L.divIcon({ html, className: "", iconSize: [14, 14], iconAnchor: [7, 7] });
}
