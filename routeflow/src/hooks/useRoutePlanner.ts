"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_OPTIMIZATION_MODE,
  DEFAULT_TRANSPORT_MODE,
} from "@/lib/constants";
import { DEMO_DESTINATIONS, DEMO_ORIGIN } from "@/lib/demoData";
import { clearSession, loadSession, saveSession } from "@/lib/session";
import { geocodingService } from "@/services/geocoding";
import { locationService } from "@/services/location/locationService";
import { planRoute } from "@/services/routePlanner";
import {
  AppError,
  type AppErrorCode,
  type Destination,
  type Location,
  type OptimizationMode,
  type OptimizedRoute,
  type Origin,
  type TransportMode,
} from "@/types";
import { toAppError } from "@/utils/errors";
import { isSameCoordinate } from "@/utils/geo";
import { createId } from "@/utils/id";
import { decodePlan } from "@/utils/share";

export type PlannerStatus = "idle" | "calculating" | "ready" | "error";

export interface PlannerNotice {
  code: AppErrorCode | "INFO";
  message: string;
  tone: "error" | "warning" | "info";
}

const emptyOrigin: Origin = { query: "", status: "empty" };

function createDestination(order: number, query = ""): Destination {
  return {
    id: createId(),
    query,
    status: query ? "typing" : "empty",
    order,
  };
}

function reindex(destinations: Destination[]): Destination[] {
  return destinations.map((destination, index) => ({ ...destination, order: index }));
}

interface PlannerSnapshot {
  origin: Origin;
  destinations: Destination[];
  transportMode: TransportMode;
  optimizationMode: OptimizationMode;
  result: OptimizedRoute | null;
  orderedDestinations: Destination[];
  status: PlannerStatus;
  notice: PlannerNotice | null;
  isStale: boolean;
}

function defaultSnapshot(): PlannerSnapshot {
  return {
    origin: emptyOrigin,
    destinations: [createDestination(0), createDestination(1)],
    transportMode: DEFAULT_TRANSPORT_MODE,
    optimizationMode: DEFAULT_OPTIMIZATION_MODE,
    result: null,
    orderedDestinations: [],
    status: "idle",
    notice: null,
    isStale: false,
  };
}

/**
 * Estado inicial reconstruído a partir do link compartilhado (prioritário)
 * ou da sessão salva no navegador. Lido de forma síncrona na montagem: a
 * tela é renderizada apenas no cliente, então não há risco de divergência
 * com o HTML do servidor.
 */
function readInitialSnapshot(): PlannerSnapshot {
  const snapshot = defaultSnapshot();
  if (typeof window === "undefined") return snapshot;

  const shared = new URLSearchParams(window.location.search).get("r");
  if (shared) {
    const plan = decodePlan(shared);
    if (plan) {
      return {
        ...snapshot,
        origin: plan.origin,
        destinations: reindex(
          plan.destinations.length > 0 ? plan.destinations : [createDestination(0)],
        ),
        transportMode: plan.transportMode,
        optimizationMode: plan.optimizationMode,
        isStale: true,
        notice: {
          code: "INFO",
          message: "Rota compartilhada carregada. Clique em Otimizar rota para recalcular.",
          tone: "info",
        },
      };
    }
    snapshot.notice = {
      code: "UNKNOWN",
      message: "O link compartilhado é inválido ou está incompleto.",
      tone: "warning",
    };
  }

  const session = loadSession();
  if (!session) return snapshot;

  const restored: PlannerSnapshot = {
    ...snapshot,
    origin: session.origin,
    destinations: reindex(session.destinations),
    transportMode: session.transportMode,
    optimizationMode: session.optimizationMode,
  };

  if (session.lastRoute && session.orderedDestinationIds) {
    const byId = new Map(session.destinations.map((destination) => [destination.id, destination]));
    const ordered = session.orderedDestinationIds
      .map((id) => byId.get(id))
      .filter((destination): destination is Destination => Boolean(destination));
    if (ordered.length > 0) {
      restored.result = session.lastRoute;
      restored.orderedDestinations = ordered;
      restored.status = "ready";
    }
  }

  return restored;
}

/**
 * Estado central do planejador: origem, destinos, modos e resultado.
 * Concentra as regras de negócio da UI para que os componentes permaneçam
 * apresentacionais.
 */
export function useRoutePlanner() {
  const [initial] = useState(readInitialSnapshot);
  const [origin, setOrigin] = useState<Origin>(initial.origin);
  const [destinations, setDestinations] = useState<Destination[]>(initial.destinations);
  const [transportMode, setTransportMode] = useState<TransportMode>(initial.transportMode);
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>(
    initial.optimizationMode,
  );
  const [result, setResult] = useState<OptimizedRoute | null>(initial.result);
  const [orderedDestinations, setOrderedDestinations] = useState<Destination[]>(
    initial.orderedDestinations,
  );
  const [status, setStatus] = useState<PlannerStatus>(initial.status);
  const [notice, setNotice] = useState<PlannerNotice | null>(initial.notice);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  /** Marca que a ordem/os pontos mudaram desde o último cálculo. */
  const [isStale, setIsStale] = useState(initial.isStale);

  const requestRef = useRef<AbortController | null>(null);

  const resolvedDestinations = useMemo(
    () => destinations.filter((destination) => Boolean(destination.coordinate)),
    [destinations],
  );

  const canOptimize = Boolean(origin.coordinate) && resolvedDestinations.length >= 1;

  /* Persistência incremental da sessão. */
  useEffect(() => {
    saveSession({
      origin,
      destinations,
      transportMode,
      optimizationMode,
      lastRoute: result,
      orderedDestinationIds: orderedDestinations.map((destination) => destination.id),
    });
  }, [origin, destinations, transportMode, optimizationMode, result, orderedDestinations]);

  /* ------------------------------------------------------------------ *
   * Origem
   * ------------------------------------------------------------------ */
  const setOriginQuery = useCallback((query: string) => {
    setOrigin((prev) => ({
      ...prev,
      query,
      status: query ? "typing" : "empty",
      coordinate: undefined,
      address: undefined,
      errorMessage: undefined,
      fromDeviceLocation: false,
    }));
    setIsStale(true);
  }, []);

  const selectOriginLocation = useCallback((location: Location) => {
    setOrigin({
      query: location.address.label,
      address: location.address,
      coordinate: location.coordinate,
      status: "resolved",
    });
    setIsStale(true);
    setNotice(null);
  }, []);

  const useMyLocation = useCallback(async () => {
    setIsLocating(true);
    setNotice(null);
    try {
      const coordinate = await locationService.getCurrentPosition();
      setOrigin({
        query: "Minha localização",
        coordinate,
        status: "resolved",
        fromDeviceLocation: true,
        address: {
          label: `Minha localização (${coordinate.lat.toFixed(5)}, ${coordinate.lng.toFixed(5)})`,
        },
      });
      setIsStale(true);

      // Endereço legível é um extra: falhar aqui não invalida a origem.
      try {
        const place = await geocodingService.reverse(coordinate);
        if (place) {
          setOrigin((prev) =>
            prev.fromDeviceLocation
              ? { ...prev, address: place.address, query: place.address.label }
              : prev,
          );
        }
      } catch {
        /* mantém as coordenadas como rótulo */
      }
    } catch (error) {
      const appError = toAppError(error);
      setNotice({ code: appError.code, message: appError.message, tone: "warning" });
    } finally {
      setIsLocating(false);
    }
  }, []);

  /* ------------------------------------------------------------------ *
   * Destinos
   * ------------------------------------------------------------------ */
  const addDestination = useCallback(() => {
    setDestinations((prev) => reindex([...prev, createDestination(prev.length)]));
    setIsStale(true);
  }, []);

  const removeDestination = useCallback((id: string) => {
    setDestinations((prev) => {
      const next = prev.filter((destination) => destination.id !== id);
      return reindex(next.length > 0 ? next : [createDestination(0)]);
    });
    setIsStale(true);
  }, []);

  const updateDestinationQuery = useCallback((id: string, query: string) => {
    setDestinations((prev) =>
      prev.map((destination) =>
        destination.id === id
          ? {
              ...destination,
              query,
              status: query ? "typing" : "empty",
              coordinate: undefined,
              address: undefined,
              errorMessage: undefined,
            }
          : destination,
      ),
    );
    setIsStale(true);
  }, []);

  const selectDestinationLocation = useCallback(
    (id: string, location: Location) => {
      const duplicated = destinations.some(
        (destination) =>
          destination.id !== id &&
          destination.coordinate &&
          isSameCoordinate(destination.coordinate, location.coordinate),
      );
      const duplicatesOrigin =
        origin.coordinate && isSameCoordinate(origin.coordinate, location.coordinate);

      if (duplicated || duplicatesOrigin) {
        setDestinations((prev) =>
          prev.map((destination) =>
            destination.id === id
              ? {
                  ...destination,
                  query: location.address.label,
                  status: "error",
                  errorMessage: duplicatesOrigin
                    ? "Esse endereço é igual à origem."
                    : "Esse destino já está na lista.",
                }
              : destination,
          ),
        );
        setNotice({
          code: "DUPLICATE_DESTINATION",
          message: duplicatesOrigin
            ? "Esse endereço é igual à origem."
            : "Esse destino já está na lista.",
          tone: "warning",
        });
        return;
      }

      setDestinations((prev) =>
        prev.map((destination) =>
          destination.id === id
            ? {
                ...destination,
                query: location.address.label,
                address: location.address,
                coordinate: location.coordinate,
                status: "resolved",
                errorMessage: undefined,
              }
            : destination,
        ),
      );
      setIsStale(true);
      setNotice(null);
    },
    [destinations, origin.coordinate],
  );

  const reorderDestinations = useCallback((fromIndex: number, toIndex: number) => {
    setDestinations((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const next = prev.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return reindex(next);
    });
    setIsStale(true);
  }, []);

  /** Reordena a lista de paradas já calculada (drag-and-drop do resultado). */
  const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedDestinations((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const next = prev.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setIsStale(true);
  }, []);

  /* ------------------------------------------------------------------ *
   * Cálculo
   * ------------------------------------------------------------------ */
  const run = useCallback(
    async (optimize: boolean, listOverride?: Destination[]) => {
      const list = (listOverride ?? destinations).filter((destination) => destination.coordinate);

      if (!origin.coordinate || list.length === 0) {
        setNotice({
          code: "NOT_ENOUGH_POINTS",
          message: "Informe a origem e pelo menos um destino com endereço válido.",
          tone: "warning",
        });
        return;
      }

      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      setStatus("calculating");
      setNotice(null);

      try {
        const output = await planRoute({
          origin,
          destinations: list,
          mode: transportMode,
          optimizationMode,
          optimize,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setResult(output.optimized);
        setOrderedDestinations(output.orderedDestinations);
        setStatus("ready");
        setIsStale(false);

        // Reflete a ordem otimizada nos destinos do painel.
        setDestinations((prev) => {
          const positionById = new Map(
            output.orderedDestinations.map((destination, index) => [destination.id, index]),
          );
          return prev.map((destination) => ({
            ...destination,
            optimizedOrder: positionById.get(destination.id),
          }));
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const appError = error instanceof AppError ? error : toAppError(error);
        setStatus("error");
        setNotice({ code: appError.code, message: appError.message, tone: "error" });
      }
    },
    [destinations, origin, transportMode, optimizationMode],
  );

  const optimize = useCallback(() => run(true), [run]);

  /** Recalcula mantendo a ordem manual definida pelo usuário. */
  const revalidate = useCallback(() => {
    const manual = orderedDestinations.length > 0 ? orderedDestinations : destinations;
    return run(false, manual);
  }, [run, orderedDestinations, destinations]);

  /* ------------------------------------------------------------------ *
   * Sessão
   * ------------------------------------------------------------------ */
  const reset = useCallback(() => {
    requestRef.current?.abort();
    setOrigin(emptyOrigin);
    setDestinations([createDestination(0), createDestination(1)]);
    setTransportMode(DEFAULT_TRANSPORT_MODE);
    setOptimizationMode(DEFAULT_OPTIMIZATION_MODE);
    setResult(null);
    setOrderedDestinations([]);
    setStatus("idle");
    setNotice(null);
    setIsStale(false);
    clearSession();
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const loadDemo = useCallback(async () => {
    setIsLoadingDemo(true);
    setNotice(null);
    try {
      /*
       * A demo geocodifica os endereços de verdade; o fallback só entra em
       * cena se o serviço público estiver indisponível, para que o usuário
       * ainda consiga ver o fluxo completo.
       */
      const resolveStop = async (query: string, fallback: { lat: number; lng: number }) => {
        try {
          const [first] = await geocodingService.searchAddress(query, { limit: 1, countryCode: "br" });
          if (first) return { label: first.address.label, coordinate: first.coordinate, address: first.address };
        } catch {
          /* usa o fallback abaixo */
        }
        return { label: query, coordinate: fallback, address: { label: query } };
      };

      const originStop = await resolveStop(DEMO_ORIGIN.query, DEMO_ORIGIN.fallback);
      setOrigin({
        query: originStop.label,
        address: originStop.address,
        coordinate: originStop.coordinate,
        status: "resolved",
      });

      const stops: Destination[] = [];
      for (const [index, demo] of DEMO_DESTINATIONS.entries()) {
        const stop = await resolveStop(demo.query, demo.fallback);
        stops.push({
          id: createId(),
          query: stop.label,
          address: stop.address,
          coordinate: stop.coordinate,
          status: "resolved",
          order: index,
        });
      }
      setDestinations(stops);
      setResult(null);
      setOrderedDestinations([]);
      setStatus("idle");
      setIsStale(true);
    } catch (error) {
      const appError = toAppError(error);
      setNotice({ code: appError.code, message: appError.message, tone: "warning" });
    } finally {
      setIsLoadingDemo(false);
    }
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  /** Trocar de modo invalida os totais exibidos até novo cálculo. */
  const changeTransportMode = useCallback((mode: TransportMode) => {
    setTransportMode(mode);
    setIsStale(true);
  }, []);

  const changeOptimizationMode = useCallback((mode: OptimizationMode) => {
    setOptimizationMode(mode);
    setIsStale(true);
  }, []);

  return {
    origin,
    destinations,
    resolvedDestinations,
    transportMode,
    optimizationMode,
    result,
    orderedDestinations,
    status,
    notice,
    isLocating,
    isLoadingDemo,
    isStale,
    canOptimize,
    setOriginQuery,
    selectOriginLocation,
    useMyLocation,
    addDestination,
    removeDestination,
    updateDestinationQuery,
    selectDestinationLocation,
    reorderDestinations,
    reorderStops,
    optimize,
    revalidate,
    reset,
    loadDemo,
    dismissNotice,
    setTransportMode: changeTransportMode,
    setOptimizationMode: changeOptimizationMode,
  };
}

export type RoutePlanner = ReturnType<typeof useRoutePlanner>;
