import type { Coordinate, CostMatrix, Route, TransportMode } from "@/types";

export interface RoutingOptions {
  signal?: AbortSignal;
}

/**
 * Contrato do motor de rotas. Além do traçado, o provedor precisa expor uma
 * matriz de custos: é ela que alimenta a otimização com tempos e distâncias
 * reais de malha viária, em vez de distância em linha reta.
 */
export interface RoutingProvider {
  readonly name: string;
  /** Perfis realmente suportados pelo provedor. */
  supportedProfiles(): string[];
  calculateRoute(
    points: Coordinate[],
    mode: TransportMode,
    options?: RoutingOptions,
  ): Promise<Route>;
  calculateMatrix(
    points: Coordinate[],
    mode: TransportMode,
    options?: RoutingOptions,
  ): Promise<CostMatrix>;
}

/** Descreve como um modo de transporte é atendido pelo provedor. */
export interface ProfileResolution {
  profile: string;
  /** true quando o perfil é aproximação (ex.: moto atendida por perfil de carro). */
  isApproximation: boolean;
  approximationNotice?: string;
}
