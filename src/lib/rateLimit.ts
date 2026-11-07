type Bucket = { count: number; resetAt: number };

const buckets: Map<string, Bucket> =
  (globalThis as { __rateLimitBuckets?: Map<string, Bucket> })
    .__rateLimitBuckets ?? new Map();
(globalThis as { __rateLimitBuckets?: Map<string, Bucket> }).__rateLimitBuckets =
  buckets;

const MAX_BUCKETS = 10_000;

const sweep = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const allowRequest = (
  key: string,
  max: number,
  windowMs: number
): boolean => {
  const now = Date.now();
  if (buckets.size >= MAX_BUCKETS) sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
};

type HeaderSource =
  | Headers
  | Record<string, string | string[] | undefined>
  | undefined;

const readHeader = (headers: HeaderSource, name: string): string => {
  if (!headers) return "";
  if (headers instanceof Headers) return headers.get(name) ?? "";
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

export const clientIp = (headers: HeaderSource): string => {
  const forwarded = readHeader(headers, "x-forwarded-for").split(",")[0].trim();
  return forwarded || readHeader(headers, "x-real-ip").trim() || "unknown";
};

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_PER_IP = 20;
export const LOGIN_MAX_PER_ACCOUNT = 8;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000;
export const REGISTER_MAX_PER_IP = 5;
export const ACCOUNT_WINDOW_MS = 15 * 60 * 1000;
export const ACCOUNT_MAX_PER_USER = 10;
