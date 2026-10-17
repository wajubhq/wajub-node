import type { CustomerObject, RequestOptions } from "../types.js";
import { BaseClient } from "../http.js";
import { pathSegment, pickList, pickResource } from "../http-utils.js";
import { createResource } from "./resource-factory.js";

const CustomersBase = createResource<CustomerObject>({
  path: "customers",
  singular: "customer",
  plural: "customers",
});

export class CustomersResource extends CustomersBase {
  constructor(...args: ConstructorParameters<typeof BaseClient>) {
    super(...args);
  }

  async block(id: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<CustomerObject> {
    const res = await this.post(`/customers/${pathSegment(id)}/block`, params, options);
    return pickResource<CustomerObject>(res, "customer");
  }

  async unblock(id: string, options?: RequestOptions): Promise<CustomerObject> {
    const res = await this.post(`/customers/${pathSegment(id)}/unblock`, undefined, options);
    return pickResource<CustomerObject>(res, "customer");
  }

  async activate(id: string, options?: RequestOptions): Promise<CustomerObject> {
    const res = await this.post(`/customers/${pathSegment(id)}/activate`, undefined, options);
    return pickResource<CustomerObject>(res, "customer");
  }

  async deactivate(id: string, options?: RequestOptions): Promise<CustomerObject> {
    const res = await this.post(`/customers/${pathSegment(id)}/deactivate`, undefined, options);
    return pickResource<CustomerObject>(res, "customer");
  }

  async listTaxIds(customerId: string) {
    const res = await this.get(`/customers/${pathSegment(customerId)}/tax_ids`);
    return pickList<Record<string, unknown>>(res, "tax_ids");
  }

  async createTaxId(customerId: string, params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post(
      `/customers/${pathSegment(customerId)}/tax_ids`,
      params,
      options,
    );
    return pickResource<Record<string, unknown>>(res, "tax_id");
  }

  async deleteTaxId(customerId: string, taxId: string, options?: RequestOptions) {
    await this.del(`/customers/${pathSegment(customerId)}/tax_ids/${pathSegment(taxId)}`, options);
  }
}
