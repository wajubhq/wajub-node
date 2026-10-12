import { hmacSha256, timingSafeEqual } from "./crypto.js";
import { WebhookSignatureVerificationError } from "./errors.js";
import type { WebhookEvent } from "./types.js";

const DEFAULT_TOLERANCE_SECONDS = 300;

export class WebhooksResource {
  constructor(private readonly secret: string) {}

  /**
   * Verify `X-Wajub-Signature: v1={hash}` and `X-Wajub-Timestamp`, then parse the event JSON.
   *
   * `tolerance` is the replay window in seconds. Anything but a positive number
   * (a secret passed in its place, `NaN`, `0`) keeps the default 300 s: replay
   * protection cannot be switched off. A missing signature or timestamp header
   * is a `WebhookSignatureVerificationError`, like a wrong one.
   */
  constructEvent(
    payload: string | Buffer,
    signature: string | null | undefined,
    timestamp: string | null | undefined,
    tolerance: number = DEFAULT_TOLERANCE_SECONDS,
  ): WebhookEvent {
    if (!this.secret) {
      throw new Error("Wajub: webhookSecret is required for webhooks.constructEvent()");
    }
    if (typeof signature !== "string" || typeof timestamp !== "string" || timestamp === "") {
      throw new WebhookSignatureVerificationError(
        "Missing X-Wajub-Signature or X-Wajub-Timestamp header.",
      );
    }
    if (!signature.startsWith("v1=")) {
      throw new WebhookSignatureVerificationError(
        "Invalid webhook signature format. Expected v1={hash}.",
      );
    }

    const hash = signature.slice(3);
    const body = typeof payload === "string" ? payload : payload.toString("utf8");
    const expected = hmacSha256(this.secret, `${timestamp}.${body}`);

    if (!timingSafeEqual(expected, hash)) {
      throw new WebhookSignatureVerificationError("Webhook signature verification failed.");
    }

    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds)) {
      throw new WebhookSignatureVerificationError("Invalid webhook timestamp.");
    }

    // Like the other SDKs: a tolerance that is not a positive number falls back
    // to 300 s. It used to switch the window off, so a replayed delivery passed.
    const window =
      typeof tolerance === "number" && Number.isFinite(tolerance) && tolerance > 0
        ? tolerance
        : DEFAULT_TOLERANCE_SECONDS;

    const driftSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
    if (driftSeconds > window) {
      throw new WebhookSignatureVerificationError(
        `Timestamp outside tolerance zone (${Math.round(driftSeconds)}s drift, allowed ${window}s).`,
      );
    }

    return JSON.parse(body) as WebhookEvent;
  }
}
