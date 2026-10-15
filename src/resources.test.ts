import { describe, it, expect, vi } from "vitest";
import { createResource } from "./resources/resource-factory.js";

type TestItem = Record<string, unknown> & { id: string; name: string };

describe("createResource pagination", () => {
  it("lists with meta and getNextPage", async () => {
    const Resource = createResource<TestItem>({
      path: "items",
      singular: "item",
      plural: "items",
    });
    const resource = new Resource("sk_test.key", "https://api.wajub.test");

    const getSpy = vi
      .spyOn(resource, "get")
      .mockResolvedValueOnce({
        items: [{ id: "1", name: "One" }],
        meta: { current_page: 1, last_page: 2, total: 2 },
      })
      .mockResolvedValueOnce({
        items: [{ id: "2", name: "Two" }],
        meta: { current_page: 2, last_page: 2, total: 2 },
      });

    const page1 = await resource.list({ per_page: 1 });
    expect(page1.data[0]?.id).toBe("1");
    expect(page1.has_more).toBe(true);

    const page2 = await page1.getNextPage();
    expect(page2.data[0]?.id).toBe("2");
    expect(page2.has_more).toBe(false);

    getSpy.mockRestore();
  });
});

describe("PaymentsResource.create expiry", () => {
  it("sends expires.in, and turns the old expires_in into it", async () => {
    const { PaymentsResource } = await import("./resources/payments.js");
    const payments = new PaymentsResource("sk_test.key", "https://api.wajub.test");
    const postSpy = vi.spyOn(payments, "post").mockResolvedValue({ transaction: { id: "trx_1" } });

    await payments.create({ amount: 1000, currency: "XAF", email: "a@b.c", expires: { in: 60 } });
    await payments.create({ amount: 1000, currency: "XAF", email: "a@b.c", expires_in: 30 });

    expect(postSpy.mock.calls[0]?.[1]).toMatchObject({ expires: { in: 60 } });
    expect(postSpy.mock.calls[1]?.[1]).toMatchObject({ expires: { in: 30 } });
    expect(postSpy.mock.calls[1]?.[1]).not.toHaveProperty("expires_in");
  });
});

describe("ListenResource", () => {
  // The API no longer offers /listen/config and /listen/auth: both methods are
  // deprecated in favour of the Wajub CLI's `wajub listen`, and still send the
  // same request.
  it("warns once per method that config and auth are deprecated, and still sends them", async () => {
    const { ListenResource } = await import("./resources/listen.js");
    const listen = new ListenResource("sk_test.key", "https://api.wajub.test");
    const getSpy = vi.spyOn(listen, "get").mockResolvedValue({ config: { host: "example" } });
    const postSpy = vi.spyOn(listen, "post").mockResolvedValue({ auth: { token: "tok" } });
    const warnSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => {});

    try {
      expect(await listen.config()).toEqual({ host: "example" });
      expect(await listen.config()).toEqual({ host: "example" });
      expect(await listen.auth({ channel: "x" })).toEqual({ token: "tok" });

      expect(getSpy).toHaveBeenCalledWith("/listen/config");
      expect(postSpy).toHaveBeenCalledWith("/listen/auth", { channel: "x" }, undefined);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/listen\.config\(\) is deprecated.*wajub listen/);
      expect(warnSpy.mock.calls[0]?.[1]).toMatchObject({ type: "DeprecationWarning", code: "WAJUB_LISTEN_CONFIG" });
      expect(warnSpy.mock.calls[1]?.[0]).toMatch(/listen\.auth\(\) is deprecated.*wajub listen/);
      expect(warnSpy.mock.calls[1]?.[1]).toMatchObject({ type: "DeprecationWarning", code: "WAJUB_LISTEN_AUTH" });
    } finally {
      warnSpy.mockRestore();
    }
  });
});
