import type { Coordinate, Location } from "@/types";

export interface SearchOptions {
  signal?: AbortSignal;
  limit?: number;
  /** Restringe a busca a um país (ISO-3166 alpha-2), ex.: "br". */
  countryCode?: string;
  language?: string;
}

/**
 * Contrato de geocodificação. Qualquer provedor (Nominatim, Photon, Pelias,
 * LocationIQ...) só precisa implementar esta interface.
 */
export interface GeocodingProvider {
  readonly name: string;
  searchAddress(query: string, options?: SearchOptions): Promise<Location[]>;
  reverse(coordinate: Coordinate, options?: SearchOptions): Promise<Location | null>;
}
