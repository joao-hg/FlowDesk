import type { Destination, OptimizedRoute, Origin } from "@/types";
import { formatDistance, formatDuration } from "./format";

export interface ExportPayload {
  origin: Origin;
  orderedDestinations: Destination[];
  optimized: OptimizedRoute;
}

function escapeCsv(value: string): string {
  const needsQuotes = /[",;\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCsv({ origin, orderedDestinations, optimized }: ExportPayload): string {
  const header = [
    "ordem",
    "tipo",
    "endereco",
    "latitude",
    "longitude",
    "distancia_ate_proxima_m",
    "tempo_ate_proxima_s",
  ];

  const stops = [
    {
      type: "origem",
      label: origin.address?.label ?? origin.query,
      coordinate: origin.coordinate,
    },
    ...orderedDestinations.map((destination) => ({
      type: "destino",
      label: destination.address?.label ?? destination.query,
      coordinate: destination.coordinate,
    })),
  ];

  const rows = stops.map((stop, index) => {
    const leg = optimized.route.legs[index];
    return [
      String(index + 1),
      stop.type,
      stop.label,
      stop.coordinate ? String(stop.coordinate.lat) : "",
      stop.coordinate ? String(stop.coordinate.lng) : "",
      leg ? String(Math.round(leg.distanceMeters)) : "",
      leg ? String(Math.round(leg.durationSeconds)) : "",
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

export function toJson({ origin, orderedDestinations, optimized }: ExportPayload): string {
  return JSON.stringify(
    {
      generatedAt: new Date(optimized.computedAt).toISOString(),
      transportMode: optimized.mode,
      optimizationMode: optimized.optimizationMode,
      profileUsed: optimized.route.profileUsed,
      isApproximation: optimized.route.isApproximation,
      totals: {
        distanceMeters: Math.round(optimized.route.distanceMeters),
        durationSeconds: Math.round(optimized.route.durationSeconds),
        distanceLabel: formatDistance(optimized.route.distanceMeters),
        durationLabel: formatDuration(optimized.route.durationSeconds),
        stops: orderedDestinations.length + 1,
      },
      origin: {
        label: origin.address?.label ?? origin.query,
        coordinate: origin.coordinate,
      },
      stops: orderedDestinations.map((destination, index) => ({
        position: index + 2,
        label: destination.address?.label ?? destination.query,
        coordinate: destination.coordinate,
        legToNext: optimized.route.legs[index + 1]
          ? {
              distanceMeters: Math.round(optimized.route.legs[index + 1].distanceMeters),
              durationSeconds: Math.round(optimized.route.legs[index + 1].durationSeconds),
            }
          : null,
      })),
      comparison: optimized.comparison.map((route) => ({
        mode: route.mode,
        profileUsed: route.profileUsed,
        isApproximation: route.isApproximation,
        distanceMeters: Math.round(route.distanceMeters),
        durationSeconds: Math.round(route.durationSeconds),
      })),
    },
    null,
    2,
  );
}

/** Dispara o download de um conteúdo textual no navegador. */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
