import L from "leaflet";

/**
 * Marcadores são divIcons: evitam depender dos PNGs padrão do Leaflet
 * (que quebram sob bundlers) e permitem numerar as paradas.
 */
export function createPinIcon(label: string, variant: "origin" | "stop" | "pending") {
  return L.divIcon({
    className: "routeflow-marker",
    html: `<div class="routeflow-pin routeflow-pin--${variant}">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}
