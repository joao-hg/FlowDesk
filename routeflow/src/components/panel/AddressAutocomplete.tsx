"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Loader2, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAddressSearch } from "@/hooks/useAddressSearch";
import { cn } from "@/lib/utils";
import type { Location } from "@/types";

interface AddressAutocompleteProps {
  value: string;
  placeholder?: string;
  resolved?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
  onSelect: (location: Location) => void;
  onClear?: () => void;
  leading?: React.ReactNode;
  ariaLabel: string;
}

/** Resumo curto do endereço, para caber na sugestão sem virar parágrafo. */
function summarize(location: Location): { title: string; subtitle: string } {
  const { address } = location;
  const title =
    [address.street, address.number].filter(Boolean).join(", ") ||
    address.neighborhood ||
    address.city ||
    address.label.split(",")[0];
  const subtitle = [address.neighborhood, address.city, address.state]
    .filter(Boolean)
    .join(" · ");
  return { title, subtitle: subtitle || address.label };
}

export function AddressAutocomplete({
  value,
  placeholder = "Digite um endereço",
  resolved = false,
  disabled = false,
  errorMessage,
  onChange,
  onSelect,
  onClear,
  leading,
  ariaLabel,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // A busca só roda enquanto o campo está aberto e o endereço não foi resolvido.
  const { suggestions, isLoading, errorMessage: searchError } = useAddressSearch(
    value,
    isOpen && !resolved && !disabled,
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Ajuste de estado derivado durante o render: ao trocar a lista de
  // sugestões o destaque volta para o primeiro item, sem efeito extra.
  const [lastSuggestions, setLastSuggestions] = useState(suggestions);
  if (lastSuggestions !== suggestions) {
    setLastSuggestions(suggestions);
    setHighlighted(0);
  }

  const showList = isOpen && !resolved && (suggestions.length > 0 || isLoading || Boolean(searchError));

  const items = useMemo(
    () => suggestions.map((suggestion) => ({ suggestion, ...summarize(suggestion) })),
    [suggestions],
  );

  const handleSelect = (location: Location) => {
    onSelect(location);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter" && items[highlighted]) {
      event.preventDefault();
      handleSelect(items[highlighted].suggestion);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {leading ? (
          <span className="pointer-events-none absolute left-3 flex items-center">{leading}</span>
        ) : null}
        <Input
          aria-label={ariaLabel}
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          role="combobox"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            leading ? "pl-10" : undefined,
            // Espaço à direita para os ícones de status e de limpar.
            resolved && value && onClear ? "pr-16" : "pr-9",
            resolved && "border-success/40 bg-success-soft/40",
            errorMessage && "border-danger/50",
          )}
        />
        <span className="absolute right-3 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
          ) : resolved ? (
            <Check className="h-4 w-4 text-success" aria-hidden />
          ) : null}
          {value && onClear && !isLoading ? (
            <button
              type="button"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              aria-label="Limpar endereço"
              className="rounded p-0.5 text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </span>
      </div>

      {errorMessage ? (
        <p className="mt-1 text-[0.6875rem] text-danger">{errorMessage}</p>
      ) : null}

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="scroll-slim absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl"
        >
          {isLoading && items.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Buscando endereços…
            </li>
          ) : null}

          {!isLoading && items.length === 0 && searchError ? (
            <li className="px-3 py-2.5 text-xs text-muted-foreground">{searchError}</li>
          ) : null}

          {items.map((item, index) => (
            <li key={item.suggestion.providerId} role="option" aria-selected={index === highlighted}>
              <button
                type="button"
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => handleSelect(item.suggestion)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition",
                  index === highlighted ? "bg-brand-soft" : "hover:bg-surface-muted",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
