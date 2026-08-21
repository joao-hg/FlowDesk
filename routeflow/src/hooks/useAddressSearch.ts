"use client";

import { useEffect, useRef, useState } from "react";
import { geocodingService } from "@/services/geocoding";
import type { AppErrorCode, Location } from "@/types";
import { toAppError } from "@/utils/errors";
import { useDebouncedValue } from "./useDebouncedValue";

interface AddressSearchState {
  suggestions: Location[];
  isLoading: boolean;
  errorCode: AppErrorCode | null;
  errorMessage: string | null;
}

interface SearchOutcome {
  /** Consulta a que este resultado pertence. */
  query: string;
  suggestions: Location[];
  errorCode: AppErrorCode | null;
  errorMessage: string | null;
}

const MIN_QUERY_LENGTH = 3;
/*
 * Referência estável para "sem sugestões": componentes comparam a lista por
 * identidade para reagir a mudanças, então devolver [] novo a cada render
 * provocaria renderizações em cascata.
 */
const NO_SUGGESTIONS: Location[] = [];
const EMPTY: SearchOutcome = {
  query: "",
  suggestions: NO_SUGGESTIONS,
  errorCode: null,
  errorMessage: null,
};

/**
 * Autocomplete de endereços com debounce, cancelamento da requisição
 * anterior e cache (aplicado dentro do serviço de geocodificação).
 *
 * O estado guarda o resultado junto da consulta que o originou; "carregando"
 * é derivado da diferença entre a consulta atual e a última respondida, o que
 * evita renders em cascata a cada tecla digitada.
 */
export function useAddressSearch(query: string, enabled = true): AddressSearchState {
  const debouncedQuery = useDebouncedValue(query, 450);
  const [outcome, setOutcome] = useState<SearchOutcome>(EMPTY);
  const controllerRef = useRef<AbortController | null>(null);

  const trimmed = debouncedQuery.trim();
  const isActive = enabled && trimmed.length >= MIN_QUERY_LENGTH;
  const isSettled = outcome.query === trimmed;

  useEffect(() => {
    controllerRef.current?.abort();

    if (!isActive) return;

    const controller = new AbortController();
    controllerRef.current = controller;

    geocodingService
      .searchAddress(trimmed, { signal: controller.signal, limit: 6 })
      .then((suggestions) => {
        if (controller.signal.aborted) return;
        setOutcome({
          query: trimmed,
          suggestions,
          errorCode: suggestions.length === 0 ? "ADDRESS_NOT_FOUND" : null,
          errorMessage:
            suggestions.length === 0
              ? "Nenhum endereço encontrado. Tente incluir cidade e estado."
              : null,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const appError = toAppError(error);
        if (appError.message === "Requisição cancelada.") return;
        setOutcome({
          query: trimmed,
          suggestions: NO_SUGGESTIONS,
          errorCode: appError.code,
          errorMessage: appError.message,
        });
      });

    return () => controller.abort();
  }, [trimmed, isActive]);

  if (!isActive) {
    return { suggestions: NO_SUGGESTIONS, isLoading: false, errorCode: null, errorMessage: null };
  }

  if (!isSettled) {
    return { suggestions: NO_SUGGESTIONS, isLoading: true, errorCode: null, errorMessage: null };
  }

  return {
    suggestions: outcome.suggestions,
    isLoading: false,
    errorCode: outcome.errorCode,
    errorMessage: outcome.errorMessage,
  };
}
