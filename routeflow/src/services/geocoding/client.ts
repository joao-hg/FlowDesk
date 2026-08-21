"use client";

import { InFlightRegistry, TtlCache } from "@/lib/cache";
import { AppError, type Coordinate, type Location } from "@/types";
import { toAppError } from "@/utils/errors";
import type { GeocodingProvider, SearchOptions } from "./types";

interface GeocodeResponse {
  results?: Location[];
  result?: Location | null;
  error?: { code: string; message: string };
}

const searchCache = new TtlCache<Location[]>({
  persistKey: "routeflow:geocode-cache",
  ttlMs: 1000 * 60 * 60 * 24 * 7,
  maxEntries: 150,
});

const reverseCache = new TtlCache<Location | null>({
  persistKey: "routeflow:reverse-cache",
  ttlMs: 1000 * 60 * 60 * 24,
  maxEntries: 60,
});

const inFlight = new InFlightRegistry<Location[]>();

function cacheKey(query: string, options: SearchOptions) {
  return `${query.trim().toLowerCase()}|${options.limit ?? 6}|${options.countryCode ?? ""}`;
}

async function readResponse(response: Response): Promise<GeocodeResponse> {
  const payload = (await response.json().catch(() => ({}))) as GeocodeResponse;
  if (!response.ok || payload.error) {
    throw new AppError(
      (payload.error?.code as AppError["code"]) ?? "GEOCODING_FAILED",
      payload.error?.message ?? "Falha ao consultar o serviço de endereços.",
    );
  }
  return payload;
}

/**
 * Geocodificação no cliente. Fala com a própria API do RouteFlow (que
 * encapsula o Nominatim), aplicando cache local e deduplicação de chamadas
 * idênticas em voo.
 */
export class HttpGeocodingProvider implements GeocodingProvider {
  readonly name = "routeflow-api";

  async searchAddress(query: string, options: SearchOptions = {}): Promise<Location[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const key = cacheKey(trimmed, options);
    const cached = searchCache.get(key);
    if (cached) return cached;

    return inFlight.run(key, async () => {
      const params = new URLSearchParams({ q: trimmed });
      if (options.limit) params.set("limit", String(options.limit));
      if (options.countryCode) params.set("country", options.countryCode);

      try {
        const response = await fetch(`/api/geocode?${params.toString()}`, {
          signal: options.signal,
        });
        const payload = await readResponse(response);
        const results = payload.results ?? [];
        searchCache.set(key, results);
        return results;
      } catch (error) {
        throw toAppError(error);
      }
    });
  }

  async reverse(coordinate: Coordinate, options: SearchOptions = {}): Promise<Location | null> {
    const key = `${coordinate.lat.toFixed(4)},${coordinate.lng.toFixed(4)}`;
    const cached = reverseCache.get(key);
    if (cached !== undefined) return cached;

    const params = new URLSearchParams({
      lat: String(coordinate.lat),
      lng: String(coordinate.lng),
    });

    try {
      const response = await fetch(`/api/geocode/reverse?${params.toString()}`, {
        signal: options.signal,
      });
      const payload = await readResponse(response);
      const result = payload.result ?? null;
      reverseCache.set(key, result);
      return result;
    } catch (error) {
      throw toAppError(error);
    }
  }
}

export function clearGeocodingCache() {
  searchCache.clear();
  reverseCache.clear();
}
