import { BaseClient } from "../http.js";
import { pickList, pickResource } from "../http-utils.js";

export class GlobalResource extends BaseClient {
  /** `GET /` — API hello / environment info. */
  async ping() {
    return this.get("/");
  }

  /** `GET /channels` — available payment channels. */
  async channels(params?: { country?: string }) {
    const res = await this.get("/channels", params);
    return pickList<Record<string, unknown>>(res, "channels");
  }

  /** `GET /countries` — supported countries. */
  async countries(params?: { region?: string }) {
    const res = await this.get("/countries", params);
    return pickList<Record<string, unknown>>(res, "countries");
  }

  /** `GET /currencies` — supported currencies. */
  async currencies(params?: { country?: string }) {
    const res = await this.get("/currencies", params);
    return pickList<Record<string, unknown>>(res, "currencies");
  }
}
