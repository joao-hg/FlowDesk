import "server-only";

import { geocodingUserAgent, serverConfig } from "@/lib/config";
import { fetchJson } from "@/lib/http";
import { AppError, type Address, type Coordinate, type Location } from "@/types";
import type { GeocodingProvider, SearchOptions } from "./types";

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  "ISO3166-2-lvl4"?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface NominatimPlace {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
  importance?: number;
  type?: string;
  class?: string;
}

/** Extrai a sigla do estado ("SP") do código ISO "BR-SP" quando disponível. */
function stateCode(raw: NominatimAddress | undefined): string | undefined {
  const iso = raw?.["ISO3166-2-lvl4"];
  if (iso && iso.includes("-")) return iso.split("-")[1];
  return raw?.state;
}

function toAddress(place: NominatimPlace): Address {
  const raw = place.address;
  return {
    label: place.display_name,
    street: raw?.road ?? raw?.pedestrian,
    number: raw?.house_number,
    neighborhood: raw?.suburb ?? raw?.neighbourhood,
    city: raw?.city ?? raw?.town ?? raw?.village ?? raw?.municipality,
    state: stateCode(raw),
    postalCode: raw?.postcode,
    country: raw?.country,
  };
}

function toLocation(place: NominatimPlace): Location {
  const coordinate: Coordinate = {
    lat: Number.parseFloat(place.lat),
    lng: Number.parseFloat(place.lon),
  };
  return {
    providerId: String(place.place_id),
    address: toAddress(place),
    coordinate,
    relevance: place.importance,
    placeType: place.type ?? place.class,
  };
}

/**
 * Provedor de geocodificação baseado no Nominatim (OpenStreetMap).
 * Só roda no servidor: assim o User-Agent exigido pela política de uso do
 * serviço é sempre enviado e o navegador do usuário não fala direto com o
 * Nominatim.
 */
export class NominatimGeocodingProvider implements GeocodingProvider {
  readonly name = "nominatim";

  private get headers() {
    return {
      "User-Agent": geocodingUserAgent(),
      "Accept-Language": serverConfig.geocoding.language,
    };
  }

  async searchAddress(query: string, options: SearchOptions = {}): Promise<Location[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const params = new URLSearchParams({
      q: trimmed,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(options.limit ?? 6),
    });
    if (options.countryCode) params.set("countrycodes", options.countryCode);

    const url = `${serverConfig.geocoding.baseUrl}/search?${params.toString()}`;
    const places = await fetchJson<NominatimPlace[]>(url, {
      headers: this.headers,
      signal: options.signal,
    });

    if (!Array.isArray(places)) {
      throw new AppError("GEOCODING_FAILED", "Resposta inesperada do geocoder.");
    }

    return places
      .map(toLocation)
      .filter((l) => Number.isFinite(l.coordinate.lat) && Number.isFinite(l.coordinate.lng));
  }

  async reverse(coordinate: Coordinate, options: SearchOptions = {}): Promise<Location | null> {
    const params = new URLSearchParams({
      lat: String(coordinate.lat),
      lon: String(coordinate.lng),
      format: "jsonv2",
      addressdetails: "1",
    });
    const url = `${serverConfig.geocoding.baseUrl}/reverse?${params.toString()}`;
    const place = await fetchJson<NominatimPlace | { error: string }>(url, {
      headers: this.headers,
      signal: options.signal,
    });
    if (!place || "error" in place) return null;
    return toLocation(place);
  }
}
