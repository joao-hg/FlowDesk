import { Route } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[92rem] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <Route className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-foreground sm:text-base">RouteFlow</p>
            <p className="hidden text-[0.6875rem] text-muted-foreground sm:block">
              Otimização de rotas com múltiplos endereços
            </p>
          </div>
        </div>

        <p className="hidden text-[0.6875rem] text-muted-foreground md:block">
          Dados de mapa © OpenStreetMap · Rotas via OSRM
        </p>
      </div>
    </header>
  );
}
