import type { RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pickList, pickResource } from "../http-utils.js";

export class ShieldResource extends BaseClient {
  async getSettings() {
    const res = await this.get("/shield/settings");
    return pickResource<Record<string, unknown>>(res, "shield", "settings");
  }

  async updateSettings(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.put("/shield/settings", params, options);
    return pickResource<Record<string, unknown>>(res, "shield", "settings");
  }

  async stats(params?: Record<string, unknown>) {
    const res = await this.get("/shield/stats", params);
    return pickResource<Record<string, unknown>>(res, "shield", "stats");
  }

  async listBlocklist(params?: Record<string, unknown>) {
    const res = await this.get("/shield/blocklist", params);
    return pickList<Record<string, unknown>>(res, "blocklist", "entries");
  }

  async addToBlocklist(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post("/shield/blocklist", params, options);
    return pickResource<Record<string, unknown>>(res, "blocklist", "entry");
  }

  async removeFromBlocklist(id: string, options?: RequestOptions) {
    await this.del(`/shield/blocklist/${encodeURIComponent(id)}`, options);
  }
}
