import { AppError } from "@/types";
import { errorFromStatus } from "@/utils/errors";

export interface HttpOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Número de tentativas extras em falhas transitórias (5xx / rede). */
  retries?: number;
}

const DEFAULT_TIMEOUT = 12000;

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * GET com timeout, cancelamento e retry exponencial curto.
 * Erros de transporte são traduzidos para AppError já na borda.
 */
export async function fetchJson<T>(url: string, options: HttpOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, signal, headers, retries = 1 } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", ...headers },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const error = errorFromStatus(response.status, body.slice(0, 200));
        // 4xx não se resolve repetindo a mesma requisição.
        if (response.status < 500 && response.status !== 429) throw error;
        lastError = error;
      } else {
        return (await response.json()) as T;
      }
    } catch (error) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (error instanceof AppError && error.code !== "SERVICE_UNAVAILABLE") throw error;
      lastError = error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onExternalAbort);
    }

    if (attempt < retries) await delay(400 * (attempt + 1), signal);
  }

  if (lastError instanceof AppError) throw lastError;
  throw new AppError(
    "SERVICE_UNAVAILABLE",
    "O serviço externo não respondeu.",
    lastError instanceof Error ? lastError.message : undefined,
  );
}
