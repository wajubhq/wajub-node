import type { RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pathSegment, pickResource } from "../http-utils.js";
import { createPagedList, type PagedResult } from "./pagination.js";

export interface ResourceKeys {
  path: string;
  singular: string;
  plural: string;
}

export function createResource<T extends Record<string, unknown>>(keys: ResourceKeys) {
  return class Resource extends BaseClient {
    constructor(...args: ConstructorParameters<typeof BaseClient>) {
      super(...args);
    }

    async create(params: Record<string, unknown>, options?: RequestOptions): Promise<T> {
      const res = await this.post(`/${keys.path}`, params, options);
      return pickResource<T>(res, keys.singular);
    }

    async retrieve(id: string): Promise<T> {
      const res = await this.get(`/${keys.path}/${pathSegment(id)}`);
      return pickResource<T>(res, keys.singular);
    }

    async list(params?: Record<string, unknown>): Promise<PagedResult<T>> {
      return createPagedList<T>(this, `/${keys.path}`, keys.plural, params);
    }

    async update(id: string, params: Record<string, unknown>, options?: RequestOptions): Promise<T> {
      const res = await this.put(`/${keys.path}/${pathSegment(id)}`, params, options);
      return pickResource<T>(res, keys.singular);
    }

    async delete(id: string, options?: RequestOptions): Promise<void> {
      await this.del(`/${keys.path}/${pathSegment(id)}`, options);
    }
  };
}
