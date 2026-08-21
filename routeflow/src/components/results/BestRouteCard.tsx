"use client";

import { ArrowDown, MapPin, Navigation, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPTIMIZATION_MODES, TRANSPORT_MODES } from "@/lib/constants";
import type { Destination, OptimizedRoute, Origin } from "@/types";
import { formatDistance, formatDuration } from "@/utils/format";

interface BestRouteCardProps {
  origin: Origin;
  stops: Destination[];
  optimized: OptimizedRoute;
}

export function BestRouteCard({ origin, stops, optimized }: BestRouteCardProps) {
  const modeMeta = TRANSPORT_MODES[optimized.mode];
  const optimizationMeta = OPTIMIZATION_MODES[optimized.optimizationMode];

  return (
    <Card className="border-brand/30">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand" aria-hidden />
          Melhor rota
        </CardTitle>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge variant="brand">
            {modeMeta.icon} {modeMeta.label}
          </Badge>
          <Badge>{optimizationMeta.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <ol className="space-y-1">
          <li className="flex items-center gap-2.5">
            <Navigation className="h-4 w-4 shrink-0 text-success" aria-hidden />
            <span className="truncate text-sm font-medium text-foreground">
              {origin.address?.label ?? origin.query}
            </span>
          </li>
          {stops.map((stop, index) => (
            <li key={stop.id} className="space-y-1">
              <div className="pl-[0.4375rem]">
                <ArrowDown className="h-3.5 w-3.5 text-brand/50" aria-hidden />
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span className="truncate text-sm text-foreground" title={stop.address?.label}>
                  <span className="font-semibold">{index + 1}.</span>{" "}
                  {stop.address?.label ?? stop.query}
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">
            Total:{" "}
            <strong className="text-foreground tabular-nums">
              {formatDistance(optimized.route.distanceMeters)}
            </strong>
          </span>
          <span className="text-muted-foreground">
            Tempo:{" "}
            <strong className="text-foreground tabular-nums">
              {formatDuration(optimized.route.durationSeconds)}
            </strong>
          </span>
          <span className="text-muted-foreground">
            Paradas: <strong className="text-foreground">{stops.length}</strong>
          </span>
        </div>

        {optimized.route.isApproximation && modeMeta.notice ? (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-[0.6875rem] text-warning">
            {modeMeta.notice}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
