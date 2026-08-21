import type { CostMatrix, OptimizationOptions, OptimizationResult } from "@/types";

/**
 * Contrato de otimização. A entrada é sempre uma matriz de custos reais
 * (produzida pelo RoutingProvider), nunca coordenadas cruas — assim o
 * otimizador nunca cai em ordenação por distância em linha reta.
 *
 * O índice 0 da matriz é a origem; os demais são os destinos na ordem atual.
 */
export interface OptimizationProvider {
  readonly name: string;
  optimizeRoute(
    matrix: CostMatrix,
    options: OptimizationOptions,
  ): Promise<OptimizationResult>;
}
