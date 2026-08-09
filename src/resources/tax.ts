import type { RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pickList, pickResource } from "../http-utils.js";
import { createPagedList, type PagedResult } from "./pagination.js";

export class TaxResource extends BaseClient {
  async getSettings() {
    const res = await this.get("/tax/settings");
    return pickResource<Record<string, unknown>>(res, "tax", "settings");
  }

  async updateSettings(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.put("/tax/settings", params, options);
    return pickResource<Record<string, unknown>>(res, "tax", "settings");
  }

  async rates(params?: Record<string, unknown>) {
    const res = await this.get("/tax/rates", params);
    return pickList<Record<string, unknown>>(res, "rates", "tax_rates");
  }

  async calculate(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post("/tax/calculate", params, options);
    return pickResource<Record<string, unknown>>(res, "tax", "calculation");
  }

  async reports(params?: Record<string, unknown>) {
    const res = await this.get("/tax/reports", params);
    return pickList<Record<string, unknown>>(res, "reports", "tax_reports");
  }

  async listCodes(params?: Record<string, unknown>) {
    const res = await this.get("/tax/codes", params);
    return pickList<Record<string, unknown>>(res, "tax_codes", "codes");
  }

  async retrieveCode(code: string) {
    const res = await this.get(`/tax/codes/${encodeURIComponent(code)}`);
    return pickResource<Record<string, unknown>>(res, "tax_code", "code");
  }

  async listRegistrations(params?: Record<string, unknown>): Promise<PagedResult<Record<string, unknown>>> {
    return createPagedList(this, "/tax/registrations", "registrations", params);
  }

  async createRegistration(params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post("/tax/registrations", params, options);
    return pickResource<Record<string, unknown>>(res, "registration", "tax_registration");
  }

  async retrieveRegistration(id: string) {
    const res = await this.get(`/tax/registrations/${encodeURIComponent(id)}`);
    return pickResource<Record<string, unknown>>(res, "registration", "tax_registration");
  }

  async updateRegistration(id: string, params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.put(`/tax/registrations/${encodeURIComponent(id)}`, params, options);
    return pickResource<Record<string, unknown>>(res, "registration", "tax_registration");
  }

  async deleteRegistration(id: string, options?: RequestOptions) {
    await this.del(`/tax/registrations/${encodeURIComponent(id)}`, options);
  }

  async jurisdictions(params?: Record<string, unknown>) {
    const res = await this.get("/tax/jurisdictions", params);
    return pickList<Record<string, unknown>>(res, "jurisdictions", "tax_jurisdictions");
  }

  async thresholds(params?: Record<string, unknown>) {
    const res = await this.get("/tax/thresholds", params);
    return pickList<Record<string, unknown>>(res, "thresholds", "tax_thresholds");
  }

  async thresholdAlerts(params?: Record<string, unknown>) {
    const res = await this.get("/tax/thresholds/alerts", params);
    return pickList<Record<string, unknown>>(res, "alerts", "threshold_alerts");
  }
}
