"use client";

import { AppError, type Coordinate, type CostMatrix, type Route, type TransportMode } from "@/types";
import { toAppError } from "@/utils/errors";
import type { RoutingOptions, RoutingProvider } from "./types";

interface ApiError {
  error?: { code: string; message: string };
}

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const payload = (await response.json().catch(() => ({}))) as T & ApiError;
    if (!response.ok || payload.error) {
      throw new AppError(
        (payload.error?.code as AppError["code"]) ?? "SERVICE_UNAVAILABLE",
        payload.error?.message ?? "O serviço de rotas não respondeu.",
      );
    }
    return payload;
  } catch (error) {
    throw toAppError(error);
  }
}

/** Cliente do motor de rotas, servido pela API interna do RouteFlow. */
export class HttpRoutingProvider implements RoutingProvider {
  readonly name = "routeflow-api";

  supportedProfiles(): string[] {
    return ["car", "bike", "foot"];
  }

  async calculateRoute(
    points: Coordinate[],
    mode: TransportMode,
    options: RoutingOptions = {},
  ): Promise<Route> {
    const routes = await this.calculateRoutes(points, [mode], options);
    const route = routes.find((r) => r.mode === mode);
    if (!route) {
      throw new AppError("ROUTE_NOT_POSSIBLE", "Não foi possível traçar essa rota.");
    }
    return route;
  }

  /** Calcula vários modos em uma única chamada, evitando requisições repetidas. */
  async calculateRoutes(
    points: Coordinate[],
    modes: TransportMode[],
    options: RoutingOptions = {},
  ): Promise<Route[]> {
    const payload = await post<{ routes: Route[] }>(
      "/api/routing/directions",
      { points, modes },
      options.signal,
    );
    return payload.routes ?? [];
  }

  async calculateMatrix(
    points: Coordinate[],
    mode: TransportMode,
    options: RoutingOptions = {},
  ): Promise<CostMatrix> {
    const payload = await post<{ matrix: CostMatrix }>(
      "/api/routing/matrix",
      { points, mode },
      options.signal,
    );
    if (!payload.matrix?.durations?.length) {
      throw new AppError("SERVICE_UNAVAILABLE", "Matriz de custos indisponível.");
    }
    return payload.matrix;
  }
}
