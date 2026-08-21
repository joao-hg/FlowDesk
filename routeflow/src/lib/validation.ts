import { AppError, type Coordinate, type TransportMode } from "@/types";
import { isValidCoordinate } from "@/utils/geo";

const MODES: TransportMode[] = ["foot", "motorcycle", "car"];

export function parseCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) {
    throw new AppError("UNKNOWN", "Lista de pontos inválida.");
  }
  const points = value.filter(isValidCoordinate);
  if (points.length !== value.length) {
    throw new AppError("UNKNOWN", "Há coordenadas inválidas na lista de pontos.");
  }
  if (points.length < 2) {
    throw new AppError("NOT_ENOUGH_POINTS", "Informe a origem e ao menos um destino.");
  }
  return points;
}

export function parseMode(value: unknown, fallback: TransportMode = "car"): TransportMode {
  return MODES.includes(value as TransportMode) ? (value as TransportMode) : fallback;
}

export function parseModes(value: unknown): TransportMode[] {
  if (!Array.isArray(value) || value.length === 0) return MODES;
  const parsed = value.filter((mode): mode is TransportMode =>
    MODES.includes(mode as TransportMode),
  );
  return parsed.length > 0 ? parsed : MODES;
}
