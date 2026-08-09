import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BaseClient } from "./http.js";
import {
  defaultApiUrl,
  errorFromResponse,
  isRetryable,
  API_URL,
} from "./http-utils.js";
import { WajubApiError } from "./errors.js";

// Make all retry delays instant so the retry tests finish in milliseconds
// without needing fake timers (which can interact with the 30 s request-timeout
// timer and cause test hangs).
vi.mock("./http-utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./http-utils.js")>();
  return { ...actual, retryDelay: () => 0 };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResponse(
  status: number,
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as unknown as Response;
}

// ─── User-Agent header ────────────────────────────────────────────────────────

describe("BaseClient User-Agent header", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(makeResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets User-Agent: wajub-node/<version> on GET requests", async () => {
    const client = new BaseClient("sk_test.key", "https://api.example.com");
    await client.get("/test");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(headers["User-Agent"]).toMatch(/^wajub-node\//);
  });

  it("sets User-Agent: wajub-node/<version> on POST requests", async () => {
    const client = new BaseClient("sk_test.key", "https://api.example.com");
    await client.post("/test", { amount: 100 });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(headers["User-Agent"]).toMatch(/^wajub-node\//);
  });
});

// ─── Error arrays (full array preservation) ───────────────────────────────────

describe("errorFromResponse preserves full error arrays", () => {
  it("keeps all messages for each field, not just the first element", () => {
    const body = {
      message: "Validation failed",
      errors: {
        email: ["The email field is required.", "The email must be a valid email address."],
        amount: ["The amount must be positive."],
      },
    };
    const res = makeResponse(422, body);

    const err = errorFromResponse(res, body);

    expect(err.errors?.email).toEqual([
      "The email field is required.",
      "The email must be a valid email address.",
    ]);
    expect(err.errors?.amount).toEqual(["The amount must be positive."]);
  });

  it("wraps a single string error value in an array", () => {
    const body = { message: "Unprocessable", errors: { name: "The name is required." } };
    const res = makeResponse(422, body);

    const err = errorFromResponse(res, body);

    expect(err.errors?.name).toEqual(["The name is required."]);
  });

  it("sets errors to undefined when the response body has no errors key", () => {
    const body = { message: "Bad request" };
    const res = makeResponse(400, body);
    const err = errorFromResponse(res, body);

    expect(err.errors).toBeUndefined();
  });
});

// ─── isRetryable (POST without idempotency key) ───────────────────────────────

describe("isRetryable", () => {
  it("does NOT retry POST without an idempotency key on 500", () => {
    expect(isRetryable("POST", 500, false)).toBe(false);
  });

  it("does NOT retry POST without an idempotency key on 429", () => {
    expect(isRetryable("POST", 429, false)).toBe(false);
  });

  it("retries POST WITH an idempotency key on 500", () => {
    expect(isRetryable("POST", 500, true)).toBe(true);
  });

  it("retries POST WITH an idempotency key on 429", () => {
    expect(isRetryable("POST", 429, true)).toBe(true);
  });

  it("always retries GET on retryable statuses regardless of idempotency key", () => {
    expect(isRetryable("GET", 429, false)).toBe(true);
    expect(isRetryable("GET", 500, false)).toBe(true);
    expect(isRetryable("GET", 502, false)).toBe(true);
    expect(isRetryable("GET", 503, false)).toBe(true);
    expect(isRetryable("GET", 504, false)).toBe(true);
  });

  it("does not retry non-retryable statuses", () => {
    expect(isRetryable("GET", 400, false)).toBe(false);
    expect(isRetryable("GET", 401, false)).toBe(false);
    expect(isRetryable("GET", 404, false)).toBe(false);
    expect(isRetryable("GET", 422, false)).toBe(false);
  });
});

// ─── Retry behavior on 429 and 500 ───────────────────────────────────────────
//
// retryDelay is mocked at module level (top of file) to return 0 ms, so these
// tests run instantly without fake timers or timer-advancing machinery.

describe("BaseClient retry behavior", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries a GET request on 429 and succeeds on the second attempt", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(429, { message: "Too Many Requests" }))
      .mockResolvedValueOnce(makeResponse(200, { id: "trx_1" }));

    const client = new BaseClient("sk_test.key", "https://api.example.com");
    const result = await client.get("/payments");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: "trx_1" });
  });

  it("retries a GET request on 500 and succeeds on the second attempt", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse(500, { message: "Internal Server Error" }))
      .mockResolvedValueOnce(makeResponse(200, { id: "trx_2" }));

    const client = new BaseClient("sk_test.key", "https://api.example.com");
    const result = await client.get("/payments");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: "trx_2" });
  });

  it("retries up to MAX_RETRIES times then throws on persistent failures", async () => {
    // 4 total attempts: 1 original + MAX_RETRIES=3 retries.
    fetchMock.mockResolvedValue(makeResponse(500, { message: "Server Error" }));

    const client = new BaseClient("sk_test.key", "https://api.example.com");

    await expect(client.get("/payments")).rejects.toBeInstanceOf(WajubApiError);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("respects Retry-After header on 429 (rate limit)", async () => {
    fetchMock
      .mockResolvedValueOnce(
        makeResponse(429, { message: "Rate limited" }, { "retry-after": "2" }),
      )
      .mockResolvedValueOnce(makeResponse(200, { ok: true }));

    const client = new BaseClient("sk_test.key", "https://api.example.com");
    await client.get("/payments");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("POST auto-receives an idempotency key making it retryable on 500", async () => {
    // BaseClient assigns an idempotency key to every POST automatically.
    // The isRetryable suite tests the no-key=false branch directly.
    // This integration test confirms the full end-to-end retry path for POST.
    fetchMock
      .mockResolvedValueOnce(makeResponse(500, { message: "Server Error" }))
      .mockResolvedValueOnce(makeResponse(200, { ok: true }));

    const client = new BaseClient("sk_test.key", "https://api.example.com");
    await client.post("/payments", { amount: 100 });

    // The auto-assigned idempotency key makes the POST retryable.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ─── WAJUB_API_URL environment variable override ─────────────────────────────

describe("WAJUB_API_URL environment variable", () => {
  afterEach(() => {
    delete process.env.WAJUB_API_URL;
  });

  it("returns the default API URL when WAJUB_API_URL is not set", () => {
    delete process.env.WAJUB_API_URL;
    expect(defaultApiUrl()).toBe(API_URL);
  });

  it("overrides the base URL when WAJUB_API_URL is set", () => {
    process.env.WAJUB_API_URL = "https://staging.api.example.com";
    expect(defaultApiUrl()).toBe("https://staging.api.example.com");
  });

  it("strips a trailing slash from WAJUB_API_URL", () => {
    process.env.WAJUB_API_URL = "https://staging.api.example.com/";
    expect(defaultApiUrl()).toBe("https://staging.api.example.com");
  });

  it("uses the WAJUB_API_URL for actual requests when set", async () => {
    const customBaseUrl = "https://custom.api.example.com";
    process.env.WAJUB_API_URL = customBaseUrl;

    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      const client = new BaseClient("sk_test.key", defaultApiUrl());
      await client.get("/test");

      const [calledUrl] = fetchMock.mock.calls[0] as [string];
      expect(calledUrl).toContain(customBaseUrl);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
