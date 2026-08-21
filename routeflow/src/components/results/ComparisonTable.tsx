"use client";

import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TRANSPORT_MODES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Route, TransportMode } from "@/types";
import { formatDistance, formatDuration } from "@/utils/format";

interface ComparisonTableProps {
  routes: Route[];
  activeMode: TransportMode;
  onSelectMode: (mode: TransportMode) => void;
}

export function ComparisonTable({ routes, activeMode, onSelectMode }: ComparisonTableProps) {
  if (routes.length === 0) return null;

  const hasApproximation = routes.some((route) => route.isApproximation);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação por modo de transporte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
                <th scope="col" className="pb-2 font-semibold">
                  Modo
                </th>
                <th scope="col" className="pb-2 text-right font-semibold">
                  Distância
                </th>
                <th scope="col" className="pb-2 text-right font-semibold">
                  Tempo
                </th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => {
                const meta = TRANSPORT_MODES[route.mode];
                const isActive = route.mode === activeMode;
                return (
                  <tr
                    key={route.mode}
                    onClick={() => onSelectMode(route.mode)}
                    className={cn(
                      "cursor-pointer border-t border-border transition",
                      isActive ? "bg-brand-soft/60" : "hover:bg-surface-muted",
                    )}
                  >
                    <td className="py-2.5 pr-2">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <span aria-hidden>{meta.icon}</span>
                        {meta.label}
                        {route.isApproximation ? (
                          <Badge variant="warning" title={meta.notice}>
                            aproximado
                          </Badge>
                        ) : null}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">
                      {formatDistance(route.distanceMeters)}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-foreground">
                      {formatDuration(route.durationSeconds)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hasApproximation ? (
          <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[0.6875rem] leading-relaxed text-warning">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              O motor de rotas público não possui perfil de motocicleta.{" "}
              <strong>Estimativa baseada em rota de veículo.</strong> Os números da moto repetem os
              do carro em vez de inventar valores específicos.
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
