import "server-only";

import { serverConfig } from "@/lib/config";
import { fetchJson } from "@/lib/http";
import {
  AppError,
  type Coordinate,
  type CostMatrix,
  type Route,
  type RouteLeg,
  type TransportMode,
} from "@/types";
import type { ProfileResolution, RoutingOptions, RoutingProvider } from "./types";

interface OsrmLeg {
  distance: number;
  duration: number;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  legs: OsrmLeg[];
  geometry: { coordinates: [number, number][]; type: "LineString" };
}

interface OsrmRouteResponse {
  code: string;
  message?: string;
  routes?: OsrmRoute[];
}

interface OsrmTableResponse {
  code: string;
  message?: string;
  durations?: (number | null)[][];
  distances?: (number | null)[][];
}

/**
 * Perfis do OSRM. O motor não possui perfil de motocicleta: em vez de
 * inventar números, a moto é atendida pelo perfil de carro e marcada como
 * aproximação, o que a interface exibe explicitamente ao usuário.
 */
const PROFILE_BY_MODE: Record<TransportMode, ProfileResolution> = {
  foot: { profile: "foot", isApproximation: false },
  car: { profile: "car", isApproximation: false },
  motorcycle: {
    profile: "car",
    isApproximation: true,
    approximationNotice: "Estimativa baseada em rota de veículo.",
  },
};

const ENDPOINT_BY_PROFILE: Record<string, string> = {
  car: serverConfig.routing.endpoints.car,
  bike: serverConfig.routing.endpoints.bike,
  foot: serverConfig.routing.endpoints.foot,
};

/** Nome do perfil usado no path da API de cada instância dedicada. */
const OSRM_PATH_PROFILE: Record<string, string> = {
  car: "driving",
  bike: "bike",
  foot: "foot",
};

/** Limite conservador das instâncias públicas para o serviço /table. */
export const MAX_MATRIX_POINTS = 60;

function serialize(points: Coordinate[]): string {
  return points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
}

function assertOk(code: string, message: string | undefined) {
  if (code === "Ok") return;
  if (code === "NoRoute") {
    throw new AppError(
      "ROUTE_NOT_POSSIBLE",
      "Não existe rota possível entre esses pontos para o modo selecionado.",
    );
  }
  if (code === "TooBig") {
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      "Há pontos demais para o serviço público de rotas. Reduza a quantidade de destinos.",
    );
  }
  throw new AppError("SERVICE_UNAVAILABLE", message ?? `Motor de rotas retornou ${code}.`);
}

export function resolveProfile(mode: TransportMode): ProfileResolution {
  return PROFILE_BY_MODE[mode] ?? PROFILE_BY_MODE.car;
}

/** Motor de rotas OSRM (instâncias públicas da FOSSGIS por padrão). */
export class OsrmRoutingProvider implements RoutingProvider {
  readonly name = "osrm";

  supportedProfiles(): string[] {
    return Object.keys(ENDPOINT_BY_PROFILE);
  }

  private baseUrl(profile: string): string {
    const base = ENDPOINT_BY_PROFILE[profile];
    if (!base) {
      throw new AppError("SERVICE_UNAVAILABLE", `Perfil de rota não configurado: ${profile}`);
    }
    return `${base}/route/v1/${OSRM_PATH_PROFILE[profile] ?? profile}`;
  }

  private tableUrl(profile: string): string {
    const base = ENDPOINT_BY_PROFILE[profile];
    if (!base) {
      throw new AppError("SERVICE_UNAVAILABLE", `Perfil de rota não configurado: ${profile}`);
    }
    return `${base}/table/v1/${OSRM_PATH_PROFILE[profile] ?? profile}`;
  }

  async calculateRoute(
    points: Coordinate[],
    mode: TransportMode,
    options: RoutingOptions = {},
  ): Promise<Route> {
    if (points.length < 2) {
      throw new AppError("NOT_ENOUGH_POINTS", "São necessários ao menos dois pontos.");
    }
    const resolution = resolveProfile(mode);
    const params = new URLSearchParams({
      overview: "full",
      geometries: "geojson",
      steps: "false",
    });
    const url = `${this.baseUrl(resolution.profile)}/${serialize(points)}?${params.toString()}`;

    const data = await fetchJson<OsrmRouteResponse>(url, { signal: options.signal });
    assertOk(data.code, data.message);

    const route = data.routes?.[0];
    if (!route) {
      throw new AppError("ROUTE_NOT_POSSIBLE", "O motor de rotas não retornou trajeto.");
    }

    const legs: RouteLeg[] = route.legs.map((leg, index) => ({
      fromIndex: index,
      toIndex: index + 1,
      fromLabel: "",
      toLabel: "",
      distanceMeters: leg.distance,
      durationSeconds: leg.duration,
    }));

    return {
      mode,
      profileUsed: resolution.profile,
      isApproximation: resolution.isApproximation,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      legs,
      geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    };
  }

  async calculateMatrix(
    points: Coordinate[],
    mode: TransportMode,
    options: RoutingOptions = {},
  ): Promise<CostMatrix> {
    if (points.length < 2) {
      throw new AppError("NOT_ENOUGH_POINTS", "São necessários ao menos dois pontos.");
    }
    if (points.length > MAX_MATRIX_POINTS) {
      throw new AppError(
        "SERVICE_UNAVAILABLE",
        `O serviço público suporta até ${MAX_MATRIX_POINTS} pontos por cálculo.`,
      );
    }

    const resolution = resolveProfile(mode);
    const params = new URLSearchParams({ annotations: "duration,distance" });
    const url = `${this.tableUrl(resolution.profile)}/${serialize(points)}?${params.toString()}`;

    const data = await fetchJson<OsrmTableResponse>(url, { signal: options.signal });
    assertOk(data.code, data.message);

    if (!data.durations || !data.distances) {
      throw new AppError("SERVICE_UNAVAILABLE", "Matriz de custos incompleta.");
    }

    // Pares inalcançáveis vêm como null: viram Infinity para que o otimizador
    // os descarte naturalmente, em vez de tratá-los como custo zero.
    const clean = (matrix: (number | null)[][]) =>
      matrix.map((row) => row.map((value) => (value === null ? Number.POSITIVE_INFINITY : value)));

    return { durations: clean(data.durations), distances: clean(data.distances) };
  }
}
