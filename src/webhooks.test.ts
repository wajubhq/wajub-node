import { describe, it, expect } from "vitest";
import { WebhooksResource } from "./webhooks.js";
import { WebhookSignatureVerificationError } from "./errors.js";
import { hmacSha256 } from "./crypto.js";

const SECRET = "whsec_test_abc123";

function signPayload(secret: string, payload: string, timestamp: number): string {
  return "v1=" + hmacSha256(secret, `${timestamp}.${payload}`);
}

describe("WebhooksResource", () => {
  const api = new WebhooksResource(SECRET);

  it("constructs a valid event", () => {
    const payload = JSON.stringify({ type: "payment.succeeded", data: { id: "trx_1" } });
    const now = Math.floor(Date.now() / 1000);
    const sig = signPayload(SECRET, payload, now);

    const event = api.constructEvent(payload, sig, String(now));
    expect(event.type).toBe("payment.succeeded");
    expect(event.data.id).toBe("trx_1");
  });

  it("rejects invalid signature format", () => {
    const payload = JSON.stringify({ type: "payment.succeeded" });
    expect(() => api.constructEvent(payload, "abc123", String(Date.now() / 1000))).toThrow(
      WebhookSignatureVerificationError,
    );
  });

  it("rejects timestamp outside tolerance", () => {
    const payload = JSON.stringify({ type: "payment.succeeded" });
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const sig = signPayload(SECRET, payload, oldTimestamp);
    expect(() => api.constructEvent(payload, sig, String(oldTimestamp), 300)).toThrow(
      WebhookSignatureVerificationError,
    );
  });

  it("rejects a well-formed signature that doesn't match the payload (tampered body)", () => {
    const now = Math.floor(Date.now() / 1000);
    const originalPayload = JSON.stringify({ type: "payment.succeeded", data: { id: "trx_1" } });
    const sig = signPayload(SECRET, originalPayload, now);

    // Correctly formatted `v1=...` signature, but signed for a different payload —
    // exercises the timingSafeEqual mismatch branch, not the format-validation branch.
    const tamperedPayload = JSON.stringify({ type: "payment.succeeded", data: { id: "trx_2" } });

    expect(() => api.constructEvent(tamperedPayload, sig, String(now))).toThrow(
      WebhookSignatureVerificationError,
    );
    expect(() => api.constructEvent(tamperedPayload, sig, String(now))).toThrow(
      /signature verification failed/i,
    );
  });

  it("throws when no webhook secret is configured", () => {
    const unconfigured = new WebhooksResource("");
    const payload = JSON.stringify({ type: "payment.succeeded" });
    const now = Math.floor(Date.now() / 1000);
    const sig = signPayload(SECRET, payload, now);

    expect(() => unconfigured.constructEvent(payload, sig, String(now))).toThrow(
      /webhookSecret is required/i,
    );
  });
});
