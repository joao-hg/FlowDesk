"use client";

import { Crosshair, Loader2, Navigation } from "lucide-react";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { Button } from "@/components/ui/button";
import type { Location, Origin } from "@/types";

interface OriginFieldProps {
  origin: Origin;
  isLocating: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (location: Location) => void;
  onUseMyLocation: () => void;
}

export function OriginField({
  origin,
  isLocating,
  onQueryChange,
  onSelect,
  onUseMyLocation,
}: OriginFieldProps) {
  return (
    <section aria-labelledby="origin-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2
          id="origin-heading"
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          Origem
        </h2>
        {origin.fromDeviceLocation ? (
          <span className="text-[0.6875rem] font-medium text-success">
            Localização do dispositivo
          </span>
        ) : null}
      </div>

      <AddressAutocomplete
        ariaLabel="Endereço de origem"
        value={origin.query}
        placeholder="De onde você vai sair?"
        resolved={origin.status === "resolved"}
        errorMessage={origin.errorMessage}
        onChange={onQueryChange}
        onSelect={onSelect}
        onClear={() => onQueryChange("")}
        leading={<Navigation className="h-4 w-4 text-success" aria-hidden />}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={onUseMyLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Crosshair className="h-4 w-4" aria-hidden />
        )}
        Usar minha localização
      </Button>
    </section>
  );
}
