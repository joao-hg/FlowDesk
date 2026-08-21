import "server-only";

/**
 * Fila serial com intervalo mínimo entre chamadas.
 *
 * A política de uso do Nominatim permite no máximo 1 requisição por segundo.
 * Esta fila existe para RESPEITAR esse limite a partir do servidor — não para
 * contorná-lo: requisições excedentes esperam sua vez em vez de serem
 * disparadas em paralelo.
 */
class SerialThrottle {
  private queue: Promise<unknown> = Promise.resolve();
  private lastRun = 0;

  constructor(private readonly minIntervalMs: number) {}

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      const wait = this.minIntervalMs - (Date.now() - this.lastRun);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this.lastRun = Date.now();
      return task();
    });
    // A fila continua mesmo se a tarefa falhar.
    this.queue = result.catch(() => undefined);
    return result;
  }
}

export const geocodingThrottle = new SerialThrottle(1100);
