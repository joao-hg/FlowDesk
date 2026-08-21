"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OptimizedRoute } from "@/types";
import { formatDistance, formatDuration } from "@/utils/format";

interface StatsCardsProps {
  destinationsCount: number;
  optimized: OptimizedRoute | null;
  isLoading: boolean;
}

interface Stat {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}

/** Ganho percentual da sequência otimizada sobre a ordem informada. */
function efficiency(optimized: OptimizedRoute | null): { value: string; hint: string } {
  if (!optimized?.baselineCost) return { value: "—", hint: "Disponível após otimizar" };

  const isTime = optimized.optimizationMode !== "shortest";
  const before = isTime
    ? optimized.baselineCost.durationSeconds
    : optimized.baselineCost.distanceMeters;
  const after = isTime ? optimized.route.durationSeconds : optimized.route.distanceMeters;

  if (!before || before <= 0) return { value: "—", hint: "Sem base de comparação" };

  const gain = ((before - after) / before) * 100;
  if (gain <= 0.5) {
    return { value: "Ordem ideal", hint: "A ordem informada já era eficiente" };
  }
  return {
    value: `${gain.toFixed(0)}% melhor`,
    hint: isTime ? "Tempo economizado vs. ordem digitada" : "Distância economizada vs. ordem digitada",
  };
}

export function StatsCards({ destinationsCount, optimized, isLoading }: StatsCardsProps) {
  const gain = efficiency(optimized);

  const stats: Stat[] = [
    {
      icon: "📍",
      label: "Destinos",
      value: String(destinationsCount),
      hint: destinationsCount === 1 ? "1 parada" : `${destinationsCount} paradas`,
    },
    {
      icon: "⏱️",
      label: "Tempo estimado",
      value: optimized ? formatDuration(optimized.route.durationSeconds) : "—",
      hint: optimized ? "Somando todos os trechos" : "Disponível após otimizar",
    },
    {
      icon: "📏",
      label: "Distância",
      value: optimized ? formatDistance(optimized.route.distanceMeters) : "—",
      hint: optimized ? "Percurso total" : "Disponível após otimizar",
    },
    { icon: "🏆", label: "Eficiência", value: gain.value, hint: gain.hint },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-3.5 sm:p-4">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-base leading-none">
              {stat.icon}
            </span>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {stat.label}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {stat.value}
            </p>
          )}
          {stat.hint ? (
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{stat.hint}</p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
