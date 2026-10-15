import type { RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pickResource } from "../http-utils.js";

const warned = new Set<string>();

// Warns once per method, as Node's own deprecations do.
function warnDeprecated(method: "config" | "auth"): void {
  if (warned.has(method)) return;
  warned.add(method);
  if (typeof process === "undefined" || typeof process.emitWarning !== "function") return;
  process.emitWarning(
    `Wajub: listen.${method}() is deprecated: the API no longer offers it. ` +
      "To receive webhooks on your machine, forward them with the Wajub CLI: wajub listen",
    { type: "DeprecationWarning", code: `WAJUB_LISTEN_${method.toUpperCase()}` },
  );
}

export class ListenResource extends BaseClient {
  /**
   * @deprecated The API no longer offers it. To receive webhooks on your
   * machine, forward them with the Wajub CLI: `wajub listen`.
   */
  async config() {
    warnDeprecated("config");
    const res = await this.get("/listen/config");
    return pickResource<Record<string, unknown>>(res, "config", "listen");
  }

  /**
   * @deprecated The API no longer offers it. To receive webhooks on your
   * machine, forward them with the Wajub CLI: `wajub listen`.
   */
  async auth(params: Record<string, unknown>, options?: RequestOptions) {
    warnDeprecated("auth");
    const res = await this.post("/listen/auth", params, options);
    return pickResource<Record<string, unknown>>(res, "auth", "listen");
  }
}
