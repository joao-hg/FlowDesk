import type { Destination, OptimizationMode, Origin, TransportMode } from "@/types";
import { createId } from "./id";
import { isValidCoordinate } from "./geo";

/**
 * Serialização compacta da rota para a URL de compartilhamento.
 * Apenas o necessário para reconstruir o plano: texto do endereço e
 * coordenadas. Nenhum dado pessoal além do que o próprio usuário digitou.
 */
interface SharePayload {
  v: 1;
  o: { q: string; c?: [number, number] };
  d: { q: string; c?: [number, number] }[];
  m: TransportMode;
  om: OptimizationMode;
}

export interface SharedPlan {
  origin: Origin;
  destinations: Destination[];
  transportMode: TransportMode;
  optimizationMode: OptimizationMode;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePlan(plan: SharedPlan): string {
  const payload: SharePayload = {
    v: 1,
    o: {
      q: plan.origin.address?.label ?? plan.origin.query,
      c: plan.origin.coordinate
        ? [Number(plan.origin.coordinate.lat.toFixed(6)), Number(plan.origin.coordinate.lng.toFixed(6))]
        : undefined,
    },
    d: plan.destinations.map((destination) => ({
      q: destination.address?.label ?? destination.query,
      c: destination.coordinate
        ? [Number(destination.coordinate.lat.toFixed(6)), Number(destination.coordinate.lng.toFixed(6))]
        : undefined,
    })),
    m: plan.transportMode,
    om: plan.optimizationMode,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodePlan(encoded: string): SharedPlan | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as SharePayload;
    if (!parsed || parsed.v !== 1 || !parsed.o) return null;

    const toCoordinate = (value?: [number, number]) => {
      if (!value) return undefined;
      const coordinate = { lat: value[0], lng: value[1] };
      return isValidCoordinate(coordinate) ? coordinate : undefined;
    };

    const originCoordinate = toCoordinate(parsed.o.c);
    const origin: Origin = {
      query: parsed.o.q ?? "",
      address: parsed.o.q ? { label: parsed.o.q } : undefined,
      coordinate: originCoordinate,
      status: originCoordinate ? "resolved" : parsed.o.q ? "typing" : "empty",
    };

    const destinations: Destination[] = (parsed.d ?? []).map((item, index) => {
      const coordinate = toCoordinate(item.c);
      return {
        id: createId(),
        query: item.q ?? "",
        address: item.q ? { label: item.q } : undefined,
        coordinate,
        status: coordinate ? "resolved" : item.q ? "typing" : "empty",
        order: index,
      };
    });

    return {
      origin,
      destinations,
      transportMode: parsed.m ?? "car",
      optimizationMode: parsed.om ?? "fastest",
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(plan: SharedPlan, baseUrl?: string): string {
  const base =
    baseUrl ?? (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "");
  return `${base}?r=${encodePlan(plan)}`;
}
