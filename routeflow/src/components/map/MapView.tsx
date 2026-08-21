"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { RouteMapProps } from "./RouteMap";

/*
 * O Leaflet acessa `window` na importação, então o mapa só é carregado no
 * cliente. O import dinâmico também mantém a biblioteca fora do bundle
 * inicial da página.
 */
const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-muted">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Carregando mapa…
      </span>
    </div>
  ),
});

export function MapView(props: RouteMapProps) {
  return <RouteMap {...props} />;
}
