import { HttpGeocodingProvider } from "./client";
import type { GeocodingProvider } from "./types";

/**
 * Ponto único de configuração do geocoder usado pela interface.
 * Para trocar de provedor, basta apontar esta constante para outra
 * implementação de GeocodingProvider.
 */
export const geocodingService: GeocodingProvider = new HttpGeocodingProvider();

export { clearGeocodingCache } from "./client";
export type { GeocodingProvider, SearchOptions } from "./types";
