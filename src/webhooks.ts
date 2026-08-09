import { hmacSha256, timingSafeEqual } from "./crypto.js";
import { WebhookSignatureVerificationError } from "./errors.js";
import type { WebhookEvent } from "./types.js";

const DEFAULT_TOLERANCE_SECONDS = 300;

export class WebhooksResource {
  constructor(private readonly secret: string) {}

  /**
   * Verify `X-Wajub-Signature: v1={hash}` and `X-Wajub-Timestamp`, then parse the event JSON.
   */
  constructEvent(
    payload: string | Buffer,
    signature: string,
    timestamp: string,
    tolerance: number = DEFAULT_TOLERANCE_SECONDS,
  ): WebhookEvent {
    if (!this.secret) {
      throw new Error("Wajub: webhookSecret is required for webhooks.constructEvent()");
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

    const driftSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
    if (Number.isFinite(tolerance) && driftSeconds > tolerance) {
      throw new WebhookSignatureVerificationError(
        `Timestamp outside tolerance zone (${Math.round(driftSeconds)}s drift, allowed ${tolerance}s).`,
      );
    }

    return JSON.parse(body) as WebhookEvent;
  }
}
