"use client";

import { optimizationService } from "@/services/optimization";
import { routingService } from "@/services/routing";
import {
  AppError,
  type Coordinate,
  type Destination,
  type OptimizationMode,
  type OptimizedRoute,
  type Origin,
  type Route,
  type TransportMode,
} from "@/types";
import { ALL_TRANSPORT_MODES } from "@/lib/constants";

export interface PlanInput {
  origin: Origin;
  destinations: Destination[];
  mode: TransportMode;
  optimizationMode: OptimizationMode;
  /** Quando falso, mantém a ordem informada e apenas recalcula os custos. */
  optimize: boolean;
  roundTrip?: boolean;
  signal?: AbortSignal;
}

export interface PlanOutput {
  optimized: OptimizedRoute;
  /** Destinos na ordem final de visita. */
  orderedDestinations: Destination[];
}

function labelOf(destination: Destination, index: number): string {
  return destination.address?.label ?? destination.query ?? `Destino ${index + 1}`;
}

/**
 * Orquestra o cálculo completo de uma rota:
 * matriz de custos reais -> sequenciamento -> traçado por modo.
 *
 * Fica fora dos componentes de propósito: a página apenas dispara e consome
 * o resultado, sem conhecer os provedores.
 */
export async function planRoute(input: PlanInput): Promise<PlanOutput> {
  const { origin, destinations, mode, optimizationMode, optimize, signal } = input;
  const roundTrip = input.roundTrip ?? false;

  const originCoordinate = origin.coordinate;
  const resolved = destinations.filter(
    (destination): destination is Destination & { coordinate: Coordinate } =>
      Boolean(destination.coordinate),
  );

  if (!originCoordinate || resolved.length === 0) {
    throw new AppError(
      "NOT_ENOUGH_POINTS",
      "Informe a origem e pelo menos um destino com endereço válido.",
    );
  }

  const points: Coordinate[] = [originCoordinate, ...resolved.map((d) => d.coordinate)];

  let order = resolved.map((_, index) => index);
  let baselineCost;

  if (optimize && resolved.length > 1) {
    const matrix = await routingService.calculateMatrix(points, mode, { signal });
    const result = await optimizationService.optimizeRoute(matrix, {
      mode: optimizationMode,
      roundTrip,
    });
    order = result.order;
    baselineCost = result.baselineCost;
  }

  const orderedDestinations = order.map((index) => resolved[index]);
  const orderedPoints: Coordinate[] = [
    originCoordinate,
    ...orderedDestinations.map((d) => d.coordinate),
  ];
  if (roundTrip) orderedPoints.push(originCoordinate);

  const routes = await routingService.calculateRoutes(orderedPoints, ALL_TRANSPORT_MODES, {
    signal,
  });

  const primary = routes.find((route) => route.mode === mode) ?? routes[0];
  if (!primary) {
    throw new AppError("ROUTE_NOT_POSSIBLE", "Não foi possível traçar a rota.");
  }

  const withLabels = (route: Route): Route => ({
    ...route,
    legs: route.legs.map((leg, index) => ({
      ...leg,
      fromLabel:
        index === 0 ? origin.address?.label ?? origin.query : labelOf(orderedDestinations[index - 1], index - 1),
      toLabel:
        index === orderedDestinations.length
          ? origin.address?.label ?? origin.query
          : labelOf(orderedDestinations[index], index),
    })),
  });

  const optimized: OptimizedRoute = {
    order,
    mode,
    optimizationMode,
    route: withLabels(primary),
    comparison: routes.map(withLabels),
    baselineCost,
    computedAt: Date.now(),
  };

  return { optimized, orderedDestinations };
}
