const PREFIX = "cache:";

export type CacheEntry<T> = { items: T[]; savedAt: number };

const hasStorage = () => typeof window !== "undefined";

export const createCache = <T>(name: string) => {
  const keyFor = (userId: string) => `${PREFIX}${name}:${userId}`;

  const load = (userId: string): CacheEntry<T> | null => {
    try {
      if (!hasStorage()) return null;
      const raw = localStorage.getItem(keyFor(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        Array.isArray(parsed.items) &&
        typeof parsed.savedAt === "number"
      ) {
        return parsed as CacheEntry<T>;
      }
      return null;
    } catch {
      return null;
    }
  };

  const save = (userId: string, items: T[]): void => {
    try {
      if (!hasStorage()) return;
      const entry: CacheEntry<T> = { items, savedAt: Date.now() };
      localStorage.setItem(keyFor(userId), JSON.stringify(entry));
    } catch {}
  };

  return { load, save };
};

export const clearAllCaches = (): void => {
  try {
    if (!hasStorage()) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
};
