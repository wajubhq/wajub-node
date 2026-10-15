import type { DisputeObject, RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pathSegment, pickResource } from "../http-utils.js";
import { createPagedList, type PagedResult } from "./pagination.js";

export class DisputesResource extends BaseClient {
  async list(params?: Record<string, unknown>): Promise<PagedResult<DisputeObject>> {
    return createPagedList(this, "/disputes", "disputes", params);
  }

  async retrieve(id: string): Promise<DisputeObject> {
    const res = await this.get(`/disputes/${pathSegment(id)}`);
    return pickResource<DisputeObject>(res, "dispute");
  }

  async submitEvidence(id: string, params: Record<string, unknown>, options?: RequestOptions): Promise<DisputeObject> {
    const res = await this.post(`/disputes/${pathSegment(id)}/submit-evidence`, params, options);
    return pickResource<DisputeObject>(res, "dispute");
  }

  async accept(id: string, options?: RequestOptions): Promise<DisputeObject> {
    const res = await this.post(`/disputes/${pathSegment(id)}/accept`, undefined, options);
    return pickResource<DisputeObject>(res, "dispute");
  }

  async close(id: string, options?: RequestOptions): Promise<DisputeObject> {
    const res = await this.post(`/disputes/${pathSegment(id)}/close`, undefined, options);
    return pickResource<DisputeObject>(res, "dispute");
  }

  async sendMessage(id: string, params: Record<string, unknown>, options?: RequestOptions): Promise<DisputeObject> {
    const res = await this.post(`/disputes/${pathSegment(id)}/messages`, params, options);
    return pickResource<DisputeObject>(res, "dispute");
  }
}
