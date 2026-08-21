/**
 * Tipos de dominio do RouteFlow.
 *
 * Nenhum tipo aqui referencia Nominatim, OSRM ou Leaflet: os provedores
 * concretos convertem suas respostas para estas estruturas, o que permite
 * trocar geocoder / motor de rotas / biblioteca de mapa sem tocar na UI.
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

/** Endereco estruturado, ja normalizado a partir do provedor de geocodificacao. */
export interface Address {
  /** Linha completa exibida ao usuario. */
  label: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** Resultado de uma busca de endereco (autocomplete). */
export interface Location {
  /** Id estavel do provedor, usado para deduplicar sugestoes. */
  providerId: string;
  address: Address;
  coordinate: Coordinate;
  /** Confianca relativa retornada pelo provedor (0..1) quando disponivel. */
  relevance?: number;
  /** Tipo do lugar (rua, cidade, poi...), util para desambiguacao. */
  placeType?: string;
}

export type DestinationStatus =
  | "empty"
  | "typing"
  | "geocoding"
  | "resolved"
  | "error";

/**
 * Restricoes por parada. Nada disso e usado pelo otimizador da v1, mas o
 * campo existe desde ja para que restricoes futuras (janelas de atendimento,
 * precedencia, prioridade) nao exijam remodelar o estado da aplicacao.
 */
export interface StopConstraints {
  /** Janela de atendimento, formato "HH:mm". */
  openingTime?: string;
  closingTime?: string;
  /** Prioridade: quanto maior, mais cedo deve ser visitada. */
  priority?: number;
  /** Ids de destinos que precisam ser visitados antes deste. */
  after?: string[];
  /** Tempo de permanencia na parada, em segundos. */
  serviceTimeSeconds?: number;
  /** Marca a parada como fixa: o otimizador nao pode reordena-la. */
  locked?: boolean;
}

export interface Destination {
  id: string;
  /** Texto digitado pelo usuario (pode divergir do endereco resolvido). */
  query: string;
  address?: Address;
  coordinate?: Coordinate;
  status: DestinationStatus;
  errorMessage?: string;
  /** Ordem atual na lista (0-based), como o usuario a ve. */
  order: number;
  /** Ordem definida pela ultima otimizacao (0-based), quando existir. */
  optimizedOrder?: number;
  constraints?: StopConstraints;
}

export interface Origin {
  query: string;
  address?: Address;
  coordinate?: Coordinate;
  status: DestinationStatus;
  errorMessage?: string;
  /** true quando veio da geolocalizacao do navegador. */
  fromDeviceLocation?: boolean;
}

export type TransportMode = "foot" | "motorcycle" | "car";

export type OptimizationMode = "fastest" | "shortest" | "balanced";

/** Trecho entre duas paradas consecutivas. */
export interface RouteLeg {
  fromIndex: number;
  toIndex: number;
  fromLabel: string;
  toLabel: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface Route {
  mode: TransportMode;
  /** Perfil realmente usado pelo motor de rotas (ex.: "car" para moto). */
  profileUsed: string;
  /** true quando o perfil e uma aproximacao e deve ser sinalizado na UI. */
  isApproximation: boolean;
  distanceMeters: number;
  durationSeconds: number;
  legs: RouteLeg[];
  /** Geometria do traçado, na ordem de visita. */
  geometry: Coordinate[];
}

export interface OptimizedRoute {
  /**
   * Ordem otimizada dos destinos, como indices do array original de
   * destinos (nao inclui a origem, que e sempre o ponto de partida).
   */
  order: number[];
  mode: TransportMode;
  optimizationMode: OptimizationMode;
  /** Rota do modo principal escolhido. */
  route: Route;
  /** Rotas equivalentes para os demais modos, para a tabela comparativa. */
  comparison: Route[];
  /** Custo da ordem original, para calcular o ganho da otimizacao. */
  baselineCost?: RouteCost;
  computedAt: number;
}

export interface RouteCost {
  distanceMeters: number;
  durationSeconds: number;
}

/** Matriz de custos entre todos os pontos (origem + destinos). */
export interface CostMatrix {
  /** durations[i][j] em segundos. */
  durations: number[][];
  /** distances[i][j] em metros. */
  distances: number[][];
}

export interface OptimizationOptions {
  mode: OptimizationMode;
  /** A rota termina na origem? Falso por padrao (rota aberta). */
  roundTrip?: boolean;
  /** Restricoes por indice de ponto — reservado para evolucao futura. */
  constraints?: Record<number, StopConstraints>;
}

export interface OptimizationResult {
  /** Ordem otimizada em indices de destinos (0-based). */
  order: number[];
  cost: RouteCost;
  /** Custo da ordem de entrada, para comparacao. */
  baselineCost: RouteCost;
  /** Estrategia efetivamente aplicada. */
  strategy: "brute-force" | "nearest-neighbor+2opt" | "single" | "identity";
}

/** Erros de dominio: a UI mapeia cada codigo para uma mensagem amigavel. */
export type AppErrorCode =
  | "ADDRESS_NOT_FOUND"
  | "AMBIGUOUS_ADDRESS"
  | "GEOCODING_FAILED"
  | "SERVICE_UNAVAILABLE"
  | "ROUTE_NOT_POSSIBLE"
  | "RATE_LIMITED"
  | "LOCATION_DENIED"
  | "LOCATION_UNAVAILABLE"
  | "DUPLICATE_DESTINATION"
  | "NOT_ENOUGH_POINTS"
  | "NETWORK"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}
