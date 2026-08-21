import type {
  CostMatrix,
  OptimizationOptions,
  OptimizationResult,
  OptimizationMode,
  RouteCost,
} from "@/types";
import { bruteForce, nearestNeighbor, orOpt, tourCost, twoOpt, type CostFn } from "./algorithms";
import type { OptimizationProvider } from "./types";

/** Acima deste número de destinos a força bruta deixa de ser viável. */
export const BRUTE_FORCE_LIMIT = 8;

/** Média dos valores finitos da matriz, usada para normalizar o modo equilibrado. */
function meanFinite(matrix: number[][]): number {
  let sum = 0;
  let count = 0;
  for (const row of matrix) {
    for (const value of row) {
      if (Number.isFinite(value) && value > 0) {
        sum += value;
        count += 1;
      }
    }
  }
  return count > 0 ? sum / count : 1;
}

/**
 * Constrói a função de custo conforme o modo escolhido.
 * No modo equilibrado tempo e distância são normalizados pela própria média
 * da matriz antes de serem somados — sem isso, segundos e metros teriam
 * pesos arbitrários entre si.
 */
export function buildCostFn(matrix: CostMatrix, mode: OptimizationMode): CostFn {
  if (mode === "shortest") {
    return (from, to) => matrix.distances[from]?.[to] ?? Number.POSITIVE_INFINITY;
  }
  if (mode === "fastest") {
    return (from, to) => matrix.durations[from]?.[to] ?? Number.POSITIVE_INFINITY;
  }

  const durationScale = meanFinite(matrix.durations);
  const distanceScale = meanFinite(matrix.distances);
  return (from, to) => {
    const duration = matrix.durations[from]?.[to] ?? Number.POSITIVE_INFINITY;
    const distance = matrix.distances[from]?.[to] ?? Number.POSITIVE_INFINITY;
    if (!Number.isFinite(duration) || !Number.isFinite(distance)) {
      return Number.POSITIVE_INFINITY;
    }
    return 0.5 * (duration / durationScale) + 0.5 * (distance / distanceScale);
  };
}

/** Soma distância e tempo reais de uma sequência, para exibição. */
export function measureOrder(
  matrix: CostMatrix,
  destinationsOrder: number[],
  roundTrip: boolean,
): RouteCost {
  const tour = [0, ...destinationsOrder];
  let distanceMeters = 0;
  let durationSeconds = 0;
  for (let i = 0; i < tour.length - 1; i += 1) {
    const distance = matrix.distances[tour[i]]?.[tour[i + 1]];
    const duration = matrix.durations[tour[i]]?.[tour[i + 1]];
    if (Number.isFinite(distance)) distanceMeters += distance;
    if (Number.isFinite(duration)) durationSeconds += duration;
  }
  if (roundTrip && tour.length > 1) {
    const distance = matrix.distances[tour[tour.length - 1]]?.[0];
    const duration = matrix.durations[tour[tour.length - 1]]?.[0];
    if (Number.isFinite(distance)) distanceMeters += distance;
    if (Number.isFinite(duration)) durationSeconds += duration;
  }
  return { distanceMeters, durationSeconds };
}

/**
 * Otimizador local do RouteFlow.
 *
 * Estratégia: força bruta exata para poucos destinos; para quantidades
 * maiores, vizinho mais próximo como solução inicial seguida de 2-opt e
 * Or-opt. Os custos vêm sempre da matriz real do motor de rotas.
 */
export class LocalOptimizationProvider implements OptimizationProvider {
  readonly name = "routeflow-local";

  async optimizeRoute(
    matrix: CostMatrix,
    options: OptimizationOptions,
  ): Promise<OptimizationResult> {
    const total = matrix.durations.length;
    const destinationCount = total - 1;
    const roundTrip = options.roundTrip ?? false;
    const identity = Array.from({ length: destinationCount }, (_, i) => i + 1);
    const baselineCost = measureOrder(matrix, identity, roundTrip);

    if (destinationCount <= 1) {
      return {
        order: identity.map((node) => node - 1),
        cost: baselineCost,
        baselineCost,
        strategy: destinationCount === 1 ? "single" : "identity",
      };
    }

    const cost = buildCostFn(matrix, options.mode);
    const tourOptions = { roundTrip };

    let order: number[];
    let strategy: OptimizationResult["strategy"];

    if (destinationCount <= BRUTE_FORCE_LIMIT) {
      order = bruteForce(destinationCount, cost, tourOptions);
      strategy = "brute-force";
    } else {
      const initial = nearestNeighbor(destinationCount, cost);
      const afterTwoOpt = twoOpt(initial, cost, tourOptions);
      order = orOpt(afterTwoOpt, cost, tourOptions);
      strategy = "nearest-neighbor+2opt";
    }

    // Rede de segurança: a heurística nunca deve piorar a ordem informada.
    if (tourCost([0, ...order], cost, tourOptions) > tourCost([0, ...identity], cost, tourOptions)) {
      order = identity;
    }

    return {
      order: order.map((node) => node - 1),
      cost: measureOrder(matrix, order, roundTrip),
      baselineCost,
      strategy,
    };
  }
}

export const optimizationService = new LocalOptimizationProvider();
