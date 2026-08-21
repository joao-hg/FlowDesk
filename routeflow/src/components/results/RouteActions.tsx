"use client";

import { useState } from "react";
import { Check, Download, FileJson, Link2, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Destination, OptimizationMode, OptimizedRoute, Origin, TransportMode } from "@/types";
import { downloadFile, toCsv, toJson } from "@/utils/export";
import { buildShareUrl } from "@/utils/share";

interface RouteActionsProps {
  origin: Origin;
  destinations: Destination[];
  orderedDestinations: Destination[];
  optimized: OptimizedRoute;
  transportMode: TransportMode;
  optimizationMode: OptimizationMode;
  onReset: () => void;
}

export function RouteActions({
  origin,
  destinations,
  orderedDestinations,
  optimized,
  transportMode,
  optimizationMode,
  onReset,
}: RouteActionsProps) {
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");

  const handleShare = async () => {
    // A ordem otimizada vira a ordem do link, para reconstruir o mesmo plano.
    const url = buildShareUrl({
      origin,
      destinations: orderedDestinations.length > 0 ? orderedDestinations : destinations,
      transportMode,
      optimizationMode,
    });

    try {
      if (navigator.share) {
        await navigator.share({ title: "RouteFlow — rota otimizada", url });
        setShareState("copied");
      } else {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
      }
    } catch {
      // Cancelar o compartilhamento nativo não é erro; falha de clipboard é.
      try {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
      } catch {
        setShareState("error");
      }
    } finally {
      setTimeout(() => setShareState("idle"), 2500);
    }
  };

  const payload = { origin, orderedDestinations, optimized };
  const stamp = new Date(optimized.computedAt).toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compartilhar e exportar</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleShare}>
          {shareState === "copied" ? (
            <Check className="h-4 w-4 text-success" aria-hidden />
          ) : (
            <Link2 className="h-4 w-4" aria-hidden />
          )}
          {shareState === "copied"
            ? "Link copiado"
            : shareState === "error"
              ? "Copie da barra"
              : "Compartilhar rota"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => downloadFile(`routeflow-${stamp}.csv`, toCsv(payload), "text/csv")}
        >
          <Download className="h-4 w-4" aria-hidden />
          Exportar CSV
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => downloadFile(`routeflow-${stamp}.json`, toJson(payload), "application/json")}
        >
          <FileJson className="h-4 w-4" aria-hidden />
          Exportar JSON
        </Button>

        <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir / PDF
        </Button>

        <Button type="button" variant="ghost" size="sm" className="col-span-2" onClick={onReset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Iniciar nova rota
        </Button>
      </CardContent>
    </Card>
  );
}
