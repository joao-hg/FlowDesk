"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import type { Coordinate, Destination, Origin, Route } from "@/types";
import { formatDistance, formatDuration } from "@/utils/format";
import { createPinIcon } from "./markers";

export interface RouteMapProps {
  origin: Origin;
  /** Destinos na ordem em que devem ser exibidos e numerados. */
  stops: Destination[];
  route: Route | null;
  className?: string;
}

/** Reenquadra o mapa sempre que o conjunto de pontos muda. */
function FitBounds({ points }: { points: Coordinate[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: true });
  }, [map, points]);

  return null;
}

/** Corrige o tamanho do canvas quando o contêiner muda (responsivo). */
function ResizeObserverBridge() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function RouteMap({ origin, stops, route, className }: RouteMapProps) {
  const points = useMemo(() => {
    const list: Coordinate[] = [];
    if (origin.coordinate) list.push(origin.coordinate);
    for (const stop of stops) if (stop.coordinate) list.push(stop.coordinate);
    return list;
  }, [origin.coordinate, stops]);

  const polyline = useMemo(
    () => route?.geometry.map((point) => [point.lat, point.lng] as [number, number]) ?? [],
    [route],
  );

  const center = points[0] ?? DEFAULT_MAP_CENTER;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        detectRetina
      />

      <ResizeObserverBridge />
      <FitBounds points={points} />

      {polyline.length > 1 ? (
        <>
          <Polyline positions={polyline} pathOptions={{ color: "#1d4ed8", weight: 8, opacity: 0.18 }} />
          <Polyline positions={polyline} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.95 }} />
        </>
      ) : null}

      {origin.coordinate ? (
        <Marker
          position={[origin.coordinate.lat, origin.coordinate.lng]}
          icon={createPinIcon("●", "origin")}
        >
          <Popup>
            <strong className="block text-xs uppercase tracking-wide text-emerald-700">Origem</strong>
            <span>{origin.address?.label ?? origin.query}</span>
          </Popup>
        </Marker>
      ) : null}

      {stops.map((stop, index) => {
        if (!stop.coordinate) return null;
        const leg = route?.legs[index + 1];
        return (
          <Marker
            key={stop.id}
            position={[stop.coordinate.lat, stop.coordinate.lng]}
            icon={createPinIcon(String(index + 1), "stop")}
          >
            <Popup>
              <strong className="block text-xs uppercase tracking-wide text-blue-700">
                Parada {index + 1}
              </strong>
              <span className="block">{stop.address?.label ?? stop.query}</span>
              {leg ? (
                <span className="mt-1 block text-slate-500">
                  Próximo trecho: {formatDistance(leg.distanceMeters)} ·{" "}
                  {formatDuration(leg.durationSeconds)}
                </span>
              ) : null}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
