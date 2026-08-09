import {
  WajubApiError,
  WajubAuthenticationError,
  WajubConnectionError,
  WajubError,
  WajubInvalidRequestError,
  WajubPaymentError,
  WajubRateLimitError,
} from "./errors.js";

/** Normalize Authorization header value to raw API key (no Bearer prefix). */
export function normalizeApiKey(raw: string): string {
  let key = raw.trim();
  if (/^bearer\s+/i.test(key)) {
    key = key.replace(/^bearer\s+/i, "").trim();
  }
  return key;
}

export const API_URL = "https://api.wajub.com";

/** Default per-request timeout (ms) when neither `WajubConfig.timeout` nor `RequestOptions.timeout` is set. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Maximum number of automatic retries on transient failures (429, 5xx). */
export const MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms). Actual delay = base * 2^attempt + jitter. */
const RETRY_BASE_MS = 500;

/** Jitter fraction applied to each retry delay (0–1). */
const RETRY_JITTER = 0.3;

export function defaultApiUrl(): string {
  // Allow the base URL to be overridden via environment variable for staging
  // environments and local development, without touching source code.
  if (typeof process !== "undefined" && process.env?.WAJUB_API_URL) {
    return process.env.WAJUB_API_URL.replace(/\/+$/, "");
  }
  return API_URL;
}

export function createIdempotencyKey(prefix = "wajub"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type ApiEnvelope = Record<string, unknown>;

export function pickResource<T>(body: ApiEnvelope, ...keys: string[]): T {
  for (const key of keys) {
    if (body[key] !== undefined && body[key] !== null) {
      return body[key] as T;
    }
  }
  return body as T;
}

export function pickList<T>(
  body: ApiEnvelope,
  ...keys: string[]
): { data: T[]; meta?: ApiEnvelope["meta"] } {
  for (const key of keys) {
    if (body[key] !== undefined && body[key] !== null) {
      return { data: body[key] as T[], meta: body.meta as ApiEnvelope["meta"] };
    }
  }
  // Core CRUD list endpoints (payments, customers, refunds, transfers, disputes,
  // links, beneficiaries, webhook_endpoints, accounts, invoices, ...) return
  // their array under `items`. Check it before falling back to `data`, without
  // removing the resource-plural key lookups above (kept for endpoints that do
  // use them).
  if (body.items !== undefined && body.items !== null) {
    return { data: body.items as T[], meta: body.meta as ApiEnvelope["meta"] };
  }
  const data = (body.data ?? []) as T[];
  return { data, meta: body.meta as ApiEnvelope["meta"] };
}

export async function parseJsonResponse(res: Response): Promise<ApiEnvelope> {
  try {
    return (await res.json()) as ApiEnvelope;
  } catch {
    return {};
  }
}

/** Build the typed `WajubError` subclass for a non-2xx API response, based on HTTP status. */
export function errorFromResponse(res: Response, body: ApiEnvelope): WajubError {
  const message =
    typeof body.message === "string" ? body.message : `Request failed (${res.status})`;
  const code =
    typeof body.error_code === "string"
      ? body.error_code
      : typeof body.code === "string"
        ? body.code
        : `http_${res.status}`;

  // Preserve full error arrays instead of discarding all but the first message.
  const errors =
    body.errors && typeof body.errors === "object"
      ? Object.fromEntries(
          Object.entries(body.errors as Record<string, unknown>).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.map(String) : [String(v)],
          ]),
        )
      : undefined;

  switch (res.status) {
    case 401:
    case 403:
      return new WajubAuthenticationError(message, code, res.status, errors, body);
    case 402:
      return new WajubPaymentError(message, code, res.status, errors, body);
    case 400:
    case 404:
    case 422:
      return new WajubInvalidRequestError(message, code, res.status, errors, body);
    case 429: {
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfter = retryAfterHeader !== null ? Number(retryAfterHeader) : undefined;
      return new WajubRateLimitError(
        message,
        code,
        res.status,
        errors,
        body,
        Number.isFinite(retryAfter) ? retryAfter : undefined,
      );
    }
    default:
      return new WajubApiError(message, code, res.status, errors, body);
  }
}

/**
 * Determine if a failed request should be retried.
 * GET and DELETE are idempotent by definition. POST/PUT are only retried if
 * an idempotency key was supplied (ensuring the server deduplicates the replay).
 */
export function isRetryable(
  method: string,
  statusOrErr: number | Error,
  hasIdempotencyKey: boolean,
): boolean {
  // Network / timeout errors are always retryable.
  if (statusOrErr instanceof WajubConnectionError) return true;

  if (typeof statusOrErr === "number") {
    const retryableStatuses = new Set([429, 500, 502, 503, 504]);
    if (!retryableStatuses.has(statusOrErr)) return false;
  }

  const uppercaseMethod = method.toUpperCase();
  if (uppercaseMethod === "GET" || uppercaseMethod === "DELETE") return true;
  // POST / PUT: only safe to retry when idempotency key guarantees deduplication.
  return hasIdempotencyKey;
}

/** Compute retry delay with exponential backoff + jitter (ms). */
export function retryDelay(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs !== undefined && retryAfterMs > 0) return retryAfterMs;
  const base = RETRY_BASE_MS * Math.pow(2, attempt);
  const jitter = base * RETRY_JITTER * Math.random();
  return Math.round(base + jitter);
}
