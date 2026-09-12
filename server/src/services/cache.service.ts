export interface CacheEntry<T> {
  value: T;
  storedAt: number;
  expiresAt: number;
}

export class TtlCache<K, T> {
  private readonly entries = new Map<K, CacheEntry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  set(key: K, value: T): CacheEntry<T> {
    const storedAt = this.now();
    const entry = {
      value,
      storedAt,
      expiresAt: storedAt + this.ttlMs,
    };
    this.entries.set(key, entry);
    return entry;
  }

  getFresh(key: K): CacheEntry<T> | undefined {
    const entry = this.entries.get(key);
    return entry && entry.expiresAt > this.now() ? entry : undefined;
  }

  getAny(key: K): CacheEntry<T> | undefined {
    return this.entries.get(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

