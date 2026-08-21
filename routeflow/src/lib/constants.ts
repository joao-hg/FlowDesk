import type { OptimizationMode, TransportMode } from "@/types";

export const ALL_TRANSPORT_MODES: TransportMode[] = ["foot", "motorcycle", "car"];

export interface TransportModeMeta {
  id: TransportMode;
  label: string;
  icon: string;
  /** Sinaliza que o perfil usado é aproximado, não específico do veículo. */
  approximate: boolean;
  notice?: string;
}

export const TRANSPORT_MODES: Record<TransportMode, TransportModeMeta> = {
  foot: { id: "foot", label: "A pé", icon: "🚶", approximate: false },
  motorcycle: {
    id: "motorcycle",
    label: "Moto",
    icon: "🏍️",
    approximate: true,
    notice: "Estimativa baseada em rota de veículo.",
  },
  car: { id: "car", label: "Carro", icon: "🚗", approximate: false },
};

export interface OptimizationModeMeta {
  id: OptimizationMode;
  label: string;
  description: string;
}

export const OPTIMIZATION_MODES: Record<OptimizationMode, OptimizationModeMeta> = {
  fastest: {
    id: "fastest",
    label: "Menor tempo",
    description: "Sequência com o menor tempo total estimado.",
  },
  shortest: {
    id: "shortest",
    label: "Menor distância",
    description: "Sequência com a menor quilometragem total.",
  },
  balanced: {
    id: "balanced",
    label: "Equilibrada",
    description: "Combina tempo e distância com pesos iguais.",
  },
};

export const OPTIMIZATION_MODE_LIST: OptimizationModeMeta[] = [
  OPTIMIZATION_MODES.fastest,
  OPTIMIZATION_MODES.shortest,
  OPTIMIZATION_MODES.balanced,
];

export const DEFAULT_TRANSPORT_MODE: TransportMode = "car";
export const DEFAULT_OPTIMIZATION_MODE: OptimizationMode = "fastest";

/** Centro inicial do mapa (São Paulo) antes de qualquer ponto ser definido. */
export const DEFAULT_MAP_CENTER = { lat: -23.5615, lng: -46.6559 };
export const DEFAULT_MAP_ZOOM = 12;

export const STORAGE_KEYS = {
  session: "routeflow:session",
} as const;
