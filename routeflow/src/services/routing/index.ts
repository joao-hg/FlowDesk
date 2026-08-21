import { HttpRoutingProvider } from "./client";

/**
 * Motor de rotas usado pela interface. Para migrar de OSRM para
 * GraphHopper/Valhalla, troque a implementação do lado do servidor
 * (src/app/api/routing/*) — a interface continua idêntica.
 */
export const routingService = new HttpRoutingProvider();

export type { RoutingProvider, RoutingOptions, ProfileResolution } from "./types";
