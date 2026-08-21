"use client";

import { STORAGE_KEYS } from "./constants";
import type {
  Destination,
  OptimizationMode,
  OptimizedRoute,
  Origin,
  TransportMode,
} from "@/types";

/**
 * Persistência local da sessão de planejamento (endereços, coordenadas e
 * última rota calculada). Fica só no navegador: nada é enviado a servidor.
 */
export interface PersistedSession {
  origin: Origin;
  destinations: Destination[];
  transportMode: TransportMode;
  optimizationMode: OptimizationMode;
  lastRoute?: OptimizedRoute | null;
  orderedDestinationIds?: string[];
  savedAt: number;
}

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed?.origin || !Array.isArray(parsed.destinations)) return null;
    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: Omit<PersistedSession, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify({ ...session, savedAt: Date.now() }),
    );
  } catch {
    /* cota estourada ou storage bloqueado: a sessão segue apenas em memória */
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    /* ignora */
  }
}
