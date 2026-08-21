/**
 * Algoritmos de sequenciamento (TSP com ponto de partida fixo).
 *
 * Todos operam sobre uma matriz de custos reais fornecida pelo motor de
 * rotas. O índice 0 é sempre a origem e permanece fixo na primeira posição;
 * os índices 1..n são os destinos.
 */

export type CostFn = (from: number, to: number) => number;

export interface TourOptions {
  roundTrip: boolean;
}

/** Custo total de um tour que começa no nó 0. */
export function tourCost(tour: number[], cost: CostFn, options: TourOptions): number {
  let total = 0;
  for (let i = 0; i < tour.length - 1; i += 1) {
    total += cost(tour[i], tour[i + 1]);
  }
  if (options.roundTrip && tour.length > 1) {
    total += cost(tour[tour.length - 1], tour[0]);
  }
  return total;
}

/** Enumera todas as permutações dos destinos e devolve a melhor. */
export function bruteForce(n: number, cost: CostFn, options: TourOptions): number[] {
  const nodes = Array.from({ length: n }, (_, i) => i + 1);
  let best: number[] = nodes.slice();
  let bestCost = tourCost([0, ...nodes], cost, options);

  const permute = (current: number[], remaining: number[]) => {
    if (remaining.length === 0) {
      const candidate = tourCost([0, ...current], cost, options);
      if (candidate < bestCost) {
        bestCost = candidate;
        best = current.slice();
      }
      return;
    }
    for (let i = 0; i < remaining.length; i += 1) {
      const next = remaining[i];
      const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));
      current.push(next);
      permute(current, rest);
      current.pop();
    }
  };

  permute([], nodes);
  return best;
}

/** Constrói uma solução inicial visitando sempre o vizinho mais barato. */
export function nearestNeighbor(n: number, cost: CostFn): number[] {
  const unvisited = new Set(Array.from({ length: n }, (_, i) => i + 1));
  const tour: number[] = [];
  let current = 0;

  while (unvisited.size > 0) {
    let bestNode = -1;
    let bestCost = Number.POSITIVE_INFINITY;
    for (const node of unvisited) {
      const candidate = cost(current, node);
      if (candidate < bestCost) {
        bestCost = candidate;
        bestNode = node;
      }
    }
    // Todos inalcançáveis a partir daqui: mantém a ordem restante como está.
    if (bestNode === -1) {
      for (const node of unvisited) tour.push(node);
      break;
    }
    tour.push(bestNode);
    unvisited.delete(bestNode);
    current = bestNode;
  }

  return tour;
}

/**
 * Melhoria 2-opt: remove cruzamentos invertendo segmentos do trajeto.
 * A origem nunca é movida.
 */
export function twoOpt(
  destinationsOrder: number[],
  cost: CostFn,
  options: TourOptions,
  maxPasses = 40,
): number[] {
  let tour = [0, ...destinationsOrder];
  const last = tour.length - 1;
  if (last < 3) return destinationsOrder;

  let improved = true;
  let passes = 0;

  while (improved && passes < maxPasses) {
    improved = false;
    passes += 1;

    for (let i = 1; i < last; i += 1) {
      for (let j = i + 1; j <= last; j += 1) {
        const a = tour[i - 1];
        const b = tour[i];
        const c = tour[j];
        const hasSuccessor = j < last;
        const d = hasSuccessor ? tour[j + 1] : options.roundTrip ? tour[0] : -1;

        let delta: number;
        if (d === -1) {
          // Cauda aberta: só a aresta de entrada do segmento muda.
          delta = cost(a, c) - cost(a, b);
        } else {
          delta = cost(a, c) + cost(b, d) - cost(a, b) - cost(c, d);
        }

        if (delta < -1e-9) {
          const reversed = tour.slice(i, j + 1).reverse();
          tour = [...tour.slice(0, i), ...reversed, ...tour.slice(j + 1)];
          improved = true;
        }
      }
    }
  }

  return tour.slice(1);
}

/**
 * Melhoria Or-opt: realoca segmentos curtos (1 a 3 paradas) para outra
 * posição do trajeto. Complementa o 2-opt em casos que ele não resolve.
 */
export function orOpt(
  destinationsOrder: number[],
  cost: CostFn,
  options: TourOptions,
  maxPasses = 20,
): number[] {
  let best = destinationsOrder.slice();
  let bestCost = tourCost([0, ...best], cost, options);
  let improved = true;
  let passes = 0;

  while (improved && passes < maxPasses) {
    improved = false;
    passes += 1;

    for (let size = 1; size <= 3 && size < best.length; size += 1) {
      for (let start = 0; start + size <= best.length; start += 1) {
        const segment = best.slice(start, start + size);
        const rest = [...best.slice(0, start), ...best.slice(start + size)];

        for (let insertAt = 0; insertAt <= rest.length; insertAt += 1) {
          if (insertAt === start) continue;
          const candidate = [...rest.slice(0, insertAt), ...segment, ...rest.slice(insertAt)];
          const candidateCost = tourCost([0, ...candidate], cost, options);
          if (candidateCost < bestCost - 1e-9) {
            best = candidate;
            bestCost = candidateCost;
            improved = true;
          }
        }
      }
    }
  }

  return best;
}
