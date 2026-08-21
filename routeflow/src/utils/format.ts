/** Formatacao de distancia, tempo e numeros para pt-BR. */

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const decimals = km < 100 ? 1 : 0;
  return `${km.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.round(seconds / 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Versao curta usada em badges e listas compactas. */
export function formatDurationShort(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  return formatDuration(seconds);
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function padOrder(index: number): string {
  return String(index).padStart(2, "0");
}

export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(0)}%`;
}
