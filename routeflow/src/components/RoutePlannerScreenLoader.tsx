"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/*
 * A tela é carregada apenas no cliente: o estado inicial vem do localStorage
 * e da URL compartilhada, valores que não existem no servidor. Renderizar só
 * no cliente evita divergência de hidratação e mantém o Leaflet fora do
 * bundle do servidor.
 */
const RoutePlannerScreen = dynamic(
  () => import("./RoutePlannerScreen").then((mod) => mod.RoutePlannerScreen),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto max-w-[92rem] px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <Skeleton className="h-[32rem]" />
          <Skeleton className="h-[22rem] sm:h-[28rem] lg:h-[32rem]" />
        </div>
      </main>
    ),
  },
);

export function RoutePlannerScreenLoader() {
  return <RoutePlannerScreen />;
}
