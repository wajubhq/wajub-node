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
