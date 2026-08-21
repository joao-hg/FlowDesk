/**
 * Cache com TTL e persistência opcional em localStorage.
 * Serve tanto ao autocomplete (evita repetir a mesma consulta ao geocoder)
 * quanto às matrizes de custo já calculadas.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  /** Chave do localStorage; quando ausente, o cache é só em memória. */
  persistKey?: string;
}

const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24h
const DEFAULT_MAX = 200;

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;
  private readonly maxEntries: number;
  private readonly persistKey?: string;
  private hydrated = false;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttlMs ?? DEFAULT_TTL;
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX;
    this.persistKey = options.persistKey;
  }

  private hydrate() {
    if (this.hydrated || !this.persistKey || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(this.persistKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, CacheEntry<T>>;
      const now = Date.now();
      for (const [key, entry] of Object.entries(parsed)) {
        if (entry && entry.expiresAt > now) this.store.set(key, entry);
      }
    } catch {
      // Cache corrompido não pode derrubar a aplicação: descarta e segue.
      this.safeRemove();
    }
  }

  private safeRemove() {
    if (!this.persistKey || typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(this.persistKey);
    } catch {
      /* storage indisponível (modo privado, cota) */
    }
  }

  private persist() {
    if (!this.persistKey || typeof window === "undefined") return;
    try {
      const payload: Record<string, CacheEntry<T>> = {};
      for (const [key, entry] of this.store) payload[key] = entry;
      window.localStorage.setItem(this.persistKey, JSON.stringify(payload));
    } catch {
      /* cota estourada: cache em memória continua funcionando */
    }
  }

  get(key: string): T | undefined {
    this.hydrate();
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // LRU simples: reinsere para marcar como recém-usado.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  set(key: string, value: T) {
    this.hydrate();
    this.store.set(key, { value, expiresAt: Date.now() + this.ttl });
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
    this.persist();
  }

  clear() {
    this.store.clear();
    this.safeRemove();
  }
}

/**
 * Deduplica chamadas idênticas em voo: a segunda chamada com a mesma chave
 * reaproveita a promise da primeira em vez de abrir nova requisição.
 */
export class InFlightRegistry<T> {
  private pending = new Map<string, Promise<T>>();

  run(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) return existing;
    const promise = factory().finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }
}
