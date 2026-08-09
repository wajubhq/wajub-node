import type { RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pickResource } from "../http-utils.js";

export class ListenResource extends BaseClient {
  async config() {
    const res = await this.get("/listen/config");
    return pickResource<Record<string, unknown>>(res, "config", "listen");
  }

  async auth(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post("/listen/auth", params, options);
    return pickResource<Record<string, unknown>>(res, "auth", "listen");
  }
}
