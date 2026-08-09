/**
 * Mirrors the `WajubErrorType` union from the browser SDK
 * (`sdk/src/wajub-checkout.d.ts`), extended with `connection_error` for
 * transport-level failures (network errors, timeouts) that have no
 * equivalent HTTP response to classify.
 */
export type WajubErrorType =
  | "api_error"
  | "authentication_error"
  | "invalid_request_error"
  | "payment_error"
  | "rate_limit_error"
  | "connection_error";

export class WajubError extends Error {
  readonly type: WajubErrorType;
  readonly code: string;
  readonly httpStatus?: number;
  readonly errors?: Record<string, string[]>;
  readonly raw?: Record<string, unknown>;

  constructor(
    message: string,
    code = "api_error",
    httpStatus?: number,
    errors?: Record<string, string[]>,
    raw?: Record<string, unknown>,
    type: WajubErrorType = "api_error",
  ) {
    super(message);
    this.name = "WajubError";
    this.type = type;
    this.code = code;
    this.httpStatus = httpStatus;
    this.errors = errors;
    this.raw = raw;
  }
}

/** HTTP 401 (and 403, when not split out separately by the caller). */
export class WajubAuthenticationError extends WajubError {
  constructor(
    message: string,
    code = "authentication_error",
    httpStatus?: number,
    errors?: Record<string, string[]>,
    raw?: Record<string, unknown>,
  ) {
    super(message, code, httpStatus, errors, raw, "authentication_error");
    this.name = "WajubAuthenticationError";
  }
}

/** HTTP 400 / 404 / 422 — malformed or semantically invalid request. */
export class WajubInvalidRequestError extends WajubError {
  constructor(
    message: string,
    code = "invalid_request_error",
    httpStatus?: number,
    errors?: Record<string, string[]>,
    raw?: Record<string, unknown>,
  ) {
    super(message, code, httpStatus, errors, raw, "invalid_request_error");
    this.name = "WajubInvalidRequestError";
  }
}

/** HTTP 402 — payment could not be processed. */
export class WajubPaymentError extends WajubError {
  constructor(
    message: string,
    code = "payment_error",
    httpStatus?: number,
    errors?: Record<string, string[]>,
    raw?: Record<string, unknown>,
  ) {
    super(message, code, httpStatus, errors, raw, "payment_error");
    this.name = "WajubPaymentError";
  }
}

/** HTTP 429 — too many requests. */
export class WajubRateLimitError extends WajubError {
  readonly retryAfter?: number;

  constructor(
    message: string,
    code = "rate_limit_error",
    httpStatus?: number,
    errors?: Record<string, string[]>,
    raw?: Record<string, unknown>,
    retryAfter?: number,
  ) {
    super(message, code, httpStatus, errors, raw, "rate_limit_error");
    this.name = "WajubRateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** HTTP 5xx and any other non-2xx status not mapped above. */
export class WajubApiError extends WajubError {
  constructor(
    message: string,
    code = "api_error",
    httpStatus?: number,
    errors?: Record<string, string[]>,
    raw?: Record<string, unknown>,
  ) {
    super(message, code, httpStatus, errors, raw, "api_error");
    this.name = "WajubApiError";
  }
}

/** Transport-level failure: network error, DNS failure, or request timeout. */
export class WajubConnectionError extends WajubError {
  constructor(message: string, code = "connection_error", raw?: Record<string, unknown>) {
    super(message, code, undefined, undefined, raw, "connection_error");
    this.name = "WajubConnectionError";
  }
}

export class WebhookSignatureVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookSignatureVerificationError";
  }
}
