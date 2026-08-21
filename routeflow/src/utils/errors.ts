import { AppError, type AppErrorCode } from "@/types";

const MESSAGES: Record<AppErrorCode, string> = {
  ADDRESS_NOT_FOUND:
    "Não encontramos esse endereço. Tente incluir cidade e estado.",
  AMBIGUOUS_ADDRESS:
    "Esse endereço tem mais de um resultado possível. Escolha uma das sugestões.",
  GEOCODING_FAILED:
    "Não foi possível converter o endereço em coordenadas. Tente novamente.",
  SERVICE_UNAVAILABLE:
    "O serviço de mapas está indisponível no momento. Tente novamente em instantes.",
  ROUTE_NOT_POSSIBLE:
    "Não existe rota possível entre esses pontos para o modo selecionado.",
  RATE_LIMITED:
    "Muitas consultas em pouco tempo. Aguarde alguns segundos antes de tentar de novo.",
  LOCATION_DENIED:
    "Permissão de localização negada. Digite a origem manualmente.",
  LOCATION_UNAVAILABLE:
    "Não foi possível obter sua localização. Digite a origem manualmente.",
  DUPLICATE_DESTINATION: "Esse destino já está na lista.",
  NOT_ENOUGH_POINTS:
    "Informe a origem e pelo menos um destino para calcular a rota.",
  NETWORK: "Falha de conexão. Verifique sua internet e tente novamente.",
  UNKNOWN: "Algo deu errado. Tente novamente.",
};

export function messageForCode(code: AppErrorCode): string {
  return MESSAGES[code] ?? MESSAGES.UNKNOWN;
}

/** Converte qualquer erro em AppError, garantindo mensagem amigável. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new AppError("NETWORK", "Requisição cancelada.");
  }
  if (error instanceof TypeError) {
    return new AppError("NETWORK", MESSAGES.NETWORK, error.message);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new AppError("UNKNOWN", MESSAGES.UNKNOWN, message);
}

/** Mapeia status HTTP dos provedores para códigos de domínio. */
export function errorFromStatus(status: number, fallbackDetails?: unknown) {
  if (status === 429) return new AppError("RATE_LIMITED", MESSAGES.RATE_LIMITED);
  if (status === 404) return new AppError("ADDRESS_NOT_FOUND", MESSAGES.ADDRESS_NOT_FOUND);
  if (status >= 500)
    return new AppError("SERVICE_UNAVAILABLE", MESSAGES.SERVICE_UNAVAILABLE, fallbackDetails);
  return new AppError("UNKNOWN", MESSAGES.UNKNOWN, fallbackDetails);
}
