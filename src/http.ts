import { WajubConnectionError } from "./errors.js";
import type { RequestOptions } from "./types.js";
import {
  createIdempotencyKey,
  DEFAULT_TIMEOUT_MS,
  errorFromResponse,
  isRetryable,
  MAX_RETRIES,
  normalizeApiKey,
  parseJsonResponse,
  retryDelay,
  type ApiEnvelope,
} from "./http-utils.js";

export type { ApiEnvelope } from "./http-utils.js";
export {
  pickResource,
  pickList,
  createIdempotencyKey,
  normalizeApiKey,
  defaultApiUrl,
  errorFromResponse,
  DEFAULT_TIMEOUT_MS,
} from "./http-utils.js";

/** How the Authorization header is sent. Merchant keys use raw `sk_*`; payment sessions use Bearer. */
export type AuthMode = "api-key" | "bearer" | "none";

// SDK version — injected at build time via tsup define. Falls back to "dev" if
// the constant is not replaced (e.g. in unit tests without a build step).
declare const __SDK_VERSION__: string | undefined;
const SDK_VERSION =
  typeof __SDK_VERSION__ !== "undefined" ? __SDK_VERSION__ : "dev";

export class BaseClient {
  constructor(
    readonly apiKey: string,
    readonly baseUrl: string,
    readonly fetchOptions?: RequestInit,
    readonly idempotencyKeyPrefix?: string,
    readonly timeout?: number,
    readonly authMode: AuthMode = "api-key",
  ) {}

  authorizationHeader(): string | undefined {
    if (this.authMode === "none" || !this.apiKey) return undefined;
    const key = normalizeApiKey(this.apiKey);
    if (this.authMode === "bearer") return `Bearer ${key}`;
    return key;
  }

  async get(path: string, params?: Record<string, unknown>): Promise<ApiEnvelope> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    return this.request("GET", url.toString());
  }

  async post(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiEnvelope> {
    return this.request("POST", `${this.baseUrl}${path}`, body, options);
  }

  async put(path: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiEnvelope> {
    return this.request("PUT", `${this.baseUrl}${path}`, body, options);
  }

  async del(path: string, options?: RequestOptions): Promise<ApiEnvelope> {
    return this.request("DELETE", `${this.baseUrl}${path}`, undefined, options);
  }

  async request(
    method: string,
    url: string,
    body?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiEnvelope> {
    const idempotencyKey =
      options?.idempotencyKey ??
      (method !== "GET" && method !== "DELETE"
        ? createIdempotencyKey(this.idempotencyKeyPrefix ?? "wajub")
        : undefined);

    const maxAttempts = MAX_RETRIES + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this._attempt(method, url, body, options, idempotencyKey);
        return result;
      } catch (err) {
        const isLast = attempt >= maxAttempts - 1;

        // Determine the HTTP status if the error carries one.
        const status =
          err instanceof WajubConnectionError
            ? err
            : (err as { httpStatus?: number }).httpStatus ?? 0;

        if (isLast || !isRetryable(method, status as number | Error, !!idempotencyKey)) {
          throw err;
        }

        // Parse Retry-After header from WajubRateLimitError if present.
        const retryAfterMs =
          (err as { retryAfter?: number }).retryAfter !== undefined
            ? (err as { retryAfter: number }).retryAfter * 1000
            : undefined;

        await new Promise((r) => setTimeout(r, retryDelay(attempt, retryAfterMs)));
      }
    }

    // Unreachable — the loop always returns or throws.
    /* c8 ignore next */
    throw new WajubConnectionError("Unexpected retry loop exit");
  }

  async _attempt(
    method: string,
    url: string,
    body?: Record<string, unknown>,
    options?: RequestOptions,
    idempotencyKey?: string,
  ): Promise<ApiEnvelope> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": `wajub-node/${SDK_VERSION}`,
      ...(options?.headers ?? {}),
    };

    const authorization = this.authorizationHeader();
    if (authorization) {
      headers.Authorization = authorization;
    }

    if (options?.sync) {
      headers["X-Sync"] = options.sync;
    }

    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const effectiveTimeout = options?.timeout ?? this.timeout ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();

    const init: RequestInit = {
      method,
      headers,
      ...this.fetchOptions,
      // Always wins over any signal in fetchOptions so the timeout below is enforced.
      signal: controller.signal,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new WajubConnectionError(`Request timed out after ${effectiveTimeout}ms`);
      }
      throw new WajubConnectionError(
        err instanceof Error ? err.message : "Network request failed",
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await parseJsonResponse(res);

    if (!res.ok) {
      throw errorFromResponse(res, data);
    }

    return data;
  }
}
