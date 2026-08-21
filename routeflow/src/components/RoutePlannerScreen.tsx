"use client";

import { useMemo } from "react";
import { MapView } from "@/components/map/MapView";
import { PlannerPanel } from "@/components/panel/PlannerPanel";
import { BestRouteCard } from "@/components/results/BestRouteCard";
import { ComparisonTable } from "@/components/results/ComparisonTable";
import { RouteActions } from "@/components/results/RouteActions";
import { StatsCards } from "@/components/results/StatsCards";
import { StopsList } from "@/components/results/StopsList";
import { Card, CardContent } from "@/components/ui/card";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";

/**
 * Tela principal. Concentra apenas composição e layout — todo o estado vive
 * em useRoutePlanner e toda a integração externa, nos serviços.
 */
export function RoutePlannerScreen() {
  const planner = useRoutePlanner();
  const isCalculating = planner.status === "calculating";

  /*
   * Enquanto não há rota calculada, o mapa mostra os destinos na ordem
   * digitada; depois do cálculo, na ordem otimizada.
   */
  const mapStops = useMemo(
    () =>
      planner.result && planner.orderedDestinations.length > 0
        ? planner.orderedDestinations
        : planner.resolvedDestinations,
    [planner.result, planner.orderedDestinations, planner.resolvedDestinations],
  );

  const routeForMap = planner.result?.route ?? null;
  const showResults = Boolean(planner.result) && planner.orderedDestinations.length > 0;

  return (
    <main className="mx-auto max-w-[92rem] px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
      <section className="mb-5 sm:mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Planejador de Rotas
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Encontre a sequência mais eficiente para visitar seus destinos.
        </p>
      </section>

      <div className="mb-5 sm:mb-6">
        <StatsCards
          destinationsCount={planner.resolvedDestinations.length}
          optimized={planner.result}
          isLoading={isCalculating}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-5">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <PlannerPanel planner={planner} />
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20">
          <Card className="overflow-hidden p-0">
            <div className="h-[22rem] w-full sm:h-[28rem] lg:h-[calc(100dvh-8.5rem)]">
              <MapView origin={planner.origin} stops={mapStops} route={routeForMap} />
            </div>
          </Card>
          <p className="mt-2 px-1 text-[0.6875rem] text-muted-foreground">
            {showResults
              ? "Os números no mapa seguem a ordem otimizada de visita."
              : "Adicione endereços para vê-los no mapa. Clique em um marcador para ver os detalhes."}
          </p>
        </div>

        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-2">
          {showResults && planner.result ? (
            <>
              <BestRouteCard
                origin={planner.origin}
                stops={planner.orderedDestinations}
                optimized={planner.result}
              />
              <ComparisonTable
                routes={planner.result.comparison}
                activeMode={planner.transportMode}
                onSelectMode={planner.setTransportMode}
              />
              <StopsList
                origin={planner.origin}
                stops={planner.orderedDestinations}
                route={planner.result.route}
                isStale={planner.isStale}
                isCalculating={isCalculating}
                onReorder={planner.reorderStops}
                onRevalidate={planner.revalidate}
              />
              <RouteActions
                origin={planner.origin}
                destinations={planner.destinations}
                orderedDestinations={planner.orderedDestinations}
                optimized={planner.result}
                transportMode={planner.transportMode}
                optimizationMode={planner.optimizationMode}
                onReset={planner.reset}
              />
            </>
          ) : (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-foreground">Como funciona</h2>
                <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  <li>1. Informe a origem ou use sua localização atual.</li>
                  <li>2. Adicione quantos destinos precisar e escolha nas sugestões.</li>
                  <li>3. Selecione o modo de transporte e o critério de otimização.</li>
                  <li>4. Clique em <strong className="text-foreground">Otimizar rota</strong>.</li>
                  <li>5. Reordene manualmente se quiser e revalide o percurso.</li>
                  <li>6. Compartilhe o link ou exporte em CSV/JSON.</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
