/** Gera ids estaveis para destinos, com fallback fora de contextos seguros. */
export function createId(prefix = "dst"): string {
  const globalCrypto = typeof crypto !== "undefined" ? crypto : undefined;
  if (globalCrypto?.randomUUID) {
    return `${prefix}_${globalCrypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
