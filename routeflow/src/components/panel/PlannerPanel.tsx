"use client";

import { Loader2, Rocket, Sparkles } from "lucide-react";
import { DestinationList } from "./DestinationList";
import { OriginField } from "./OriginField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { ALL_TRANSPORT_MODES, OPTIMIZATION_MODE_LIST, TRANSPORT_MODES } from "@/lib/constants";
import type { RoutePlanner } from "@/hooks/useRoutePlanner";
import type { OptimizationMode, TransportMode } from "@/types";

interface PlannerPanelProps {
  planner: RoutePlanner;
}

export function PlannerPanel({ planner }: PlannerPanelProps) {
  const isCalculating = planner.status === "calculating";

  return (
    <Card>
      <CardContent className="space-y-5 p-4 pt-4 sm:p-5 sm:pt-5">
        {planner.notice ? (
          <Alert
            tone={planner.notice.tone === "error" ? "error" : planner.notice.tone}
            onDismiss={planner.dismissNotice}
          >
            {planner.notice.message}
          </Alert>
        ) : null}

        <OriginField
          origin={planner.origin}
          isLocating={planner.isLocating}
          onQueryChange={planner.setOriginQuery}
          onSelect={planner.selectOriginLocation}
          onUseMyLocation={planner.useMyLocation}
        />

        <DestinationList
          destinations={planner.destinations}
          onQueryChange={planner.updateDestinationQuery}
          onSelect={planner.selectDestinationLocation}
          onRemove={planner.removeDestination}
          onAdd={planner.addDestination}
          onReorder={planner.reorderDestinations}
        />

        <section aria-labelledby="transport-heading" className="space-y-2">
          <h2
            id="transport-heading"
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Modo de transporte
          </h2>
          <Segmented<TransportMode>
            ariaLabel="Modo de transporte"
            value={planner.transportMode}
            onChange={planner.setTransportMode}
            options={ALL_TRANSPORT_MODES.map((mode) => ({
              value: mode,
              label: TRANSPORT_MODES[mode].label,
              icon: TRANSPORT_MODES[mode].icon,
              hint: TRANSPORT_MODES[mode].notice,
            }))}
          />
          {TRANSPORT_MODES[planner.transportMode].notice ? (
            <p className="text-[0.6875rem] text-warning">
              {TRANSPORT_MODES[planner.transportMode].notice}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="optimization-heading" className="space-y-2">
          <h2
            id="optimization-heading"
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Critério de otimização
          </h2>
          <Segmented<OptimizationMode>
            ariaLabel="Critério de otimização"
            value={planner.optimizationMode}
            onChange={planner.setOptimizationMode}
            options={OPTIMIZATION_MODE_LIST.map((mode) => ({
              value: mode.id,
              label: mode.label,
              hint: mode.description,
            }))}
          />
        </section>

        <div className="space-y-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={planner.optimize}
            disabled={!planner.canOptimize || isCalculating}
          >
            {isCalculating ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Rocket className="h-5 w-5" aria-hidden />
            )}
            {isCalculating ? "Calculando rota…" : "Otimizar rota"}
          </Button>

          {!planner.canOptimize ? (
            <p className="text-center text-[0.6875rem] text-muted-foreground">
              Selecione a origem e ao menos um destino nas sugestões para liberar o cálculo.
            </p>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={planner.loadDemo}
            disabled={planner.isLoadingDemo || isCalculating}
          >
            {planner.isLoadingDemo ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            Testar demonstração
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
