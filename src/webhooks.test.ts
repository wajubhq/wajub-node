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
    const payload = JSON.stringify({ id: "evt_1", event: "payment.succeeded", data: { id: "trx_1" } });
    const now = Math.floor(Date.now() / 1000);
    const sig = signPayload(SECRET, payload, now);

    const event = api.constructEvent(payload, sig, String(now));
    expect(event.event).toBe("payment.succeeded");
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

  it("keeps the 300 s replay window when the tolerance is not a number", () => {
    // A secret passed where the tolerance goes used to switch the window off.
    const payload = JSON.stringify({ id: "evt_1", event: "payment.succeeded", data: {} });
    const replayed = Math.floor(Date.now() / 1000) - 3600;
    const sig = signPayload(SECRET, payload, replayed);

    expect(() =>
      api.constructEvent(payload, sig, String(replayed), "whsec_test_abc123" as unknown as number),
    ).toThrow(/outside tolerance zone/i);
    expect(() => api.constructEvent(payload, sig, String(replayed), Number.NaN)).toThrow(
      /outside tolerance zone/i,
    );
  });

  it("answers a missing signature or timestamp header with a signature error", () => {
    const payload = JSON.stringify({ id: "evt_1", event: "payment.succeeded", data: {} });
    const now = String(Math.floor(Date.now() / 1000));

    expect(() => api.constructEvent(payload, undefined as unknown as string, now)).toThrow(
      WebhookSignatureVerificationError,
    );
    expect(() =>
      api.constructEvent(payload, signPayload(SECRET, payload, Number(now)), undefined as unknown as string),
    ).toThrow(WebhookSignatureVerificationError);
  });

  it("returns the envelope the API sends: id, event, created, data", () => {
    const payload = JSON.stringify({
      id: "evt_1",
      event: "payment.succeeded",
      created: "2026-10-12T08:00:00+00:00",
      livemode: false,
      data: { id: "trx_1" },
    });
    const now = Math.floor(Date.now() / 1000);

    const event = api.constructEvent(payload, signPayload(SECRET, payload, now), String(now));

    expect(event.id).toBe("evt_1");
    expect(event.event).toBe("payment.succeeded");
    expect(event.created).toBe("2026-10-12T08:00:00+00:00");
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
