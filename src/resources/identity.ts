import type { RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pickResource } from "../http-utils.js";

export class IdentityResource extends BaseClient {
  async resolve(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post("/identity/resolve", params, options);
    return pickResource<Record<string, unknown>>(res, "identity");
  }

  async validate(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post("/identity/validate", params, options);
    return pickResource<Record<string, unknown>>(res, "identity");
  }
}
