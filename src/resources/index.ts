import type {
  AccountObject,
  BalanceObject,
  BeneficiaryObject,
  EventObject,
  InvoiceObject,
  LinkObject,
  RefundObject,
  RequestOptions,
  TransferObject,
  WebhookEndpointObject,
} from "../types.js";
import { BaseClient } from "../http.js";
import { pickResource } from "../http-utils.js";
import { createPagedList } from "./pagination.js";
import { createResource } from "./resource-factory.js";

export type { PagedResult } from "./pagination.js";
export { createPagedList } from "./pagination.js";
export { createResource } from "./resource-factory.js";

export { CustomersResource } from "./customers.js";
export { GlobalResource } from "./global.js";
export { DisputesResource } from "./disputes.js";
export { IdentityResource } from "./identity.js";
export { TaxResource } from "./tax.js";
export { ShieldResource } from "./shield.js";
export { ListenResource } from "./listen.js";

export const RefundsResource = createResource<RefundObject>({
  path: "refunds",
  singular: "refund",
  plural: "refunds",
});
export const TransfersResource = createResource<TransferObject>({
  path: "transfers",
  singular: "transfer",
  plural: "transfers",
});
export const BeneficiariesResource = createResource<BeneficiaryObject>({
  path: "beneficiaries",
  singular: "beneficiary",
  plural: "beneficiaries",
});
export const LinksResource = createResource<LinkObject>({ path: "links", singular: "link", plural: "links" });

const InvoicesBase = createResource<InvoiceObject>({ path: "invoices", singular: "invoice", plural: "invoices" });

export class InvoicesResource extends InvoicesBase {
  constructor(...args: ConstructorParameters<typeof BaseClient>) {
    super(...args);
  }

  async send(id: string, options?: RequestOptions): Promise<InvoiceObject> {
    const res = await this.post(`/invoices/${encodeURIComponent(id)}/send`, undefined, options);
    return pickResource<InvoiceObject>(res, "invoice");
  }

  async markPaid(id: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<InvoiceObject> {
    const res = await this.post(`/invoices/${encodeURIComponent(id)}/mark-paid`, params, options);
    return pickResource<InvoiceObject>(res, "invoice");
  }

  async cancel(id: string, options?: RequestOptions): Promise<InvoiceObject> {
    const res = await this.post(`/invoices/${encodeURIComponent(id)}/cancel`, undefined, options);
    return pickResource<InvoiceObject>(res, "invoice");
  }
}

export class BalanceResource extends BaseClient {
  constructor(...args: ConstructorParameters<typeof BaseClient>) {
    super(...args);
  }

  async retrieve(): Promise<BalanceObject> {
    const res = await this.get("/balance");
    return pickResource<BalanceObject>(res, "balance", "data");
  }
}

export class EventsResource extends BaseClient {
  constructor(...args: ConstructorParameters<typeof BaseClient>) {
    super(...args);
  }

  async list(params?: Record<string, unknown>) {
    return createPagedList<EventObject>(this, "/events", "events", params);
  }

  async retrieve(id: string): Promise<EventObject> {
    const res = await this.get(`/events/${encodeURIComponent(id)}`);
    return pickResource<EventObject>(res, "event");
  }

  async resend(id: string, options?: RequestOptions): Promise<EventObject> {
    const res = await this.post(`/events/${encodeURIComponent(id)}/resend`, undefined, options);
    return pickResource<EventObject>(res, "event");
  }
}

const AccountsBase = createResource<AccountObject>({ path: "accounts", singular: "account", plural: "accounts" });

export class AccountsResource extends AccountsBase {
  constructor(...args: ConstructorParameters<typeof BaseClient>) {
    super(...args);
  }

  async regenerateToken(id: string, options?: RequestOptions): Promise<AccountObject> {
    const res = await this.post(`/accounts/${encodeURIComponent(id)}/token`, undefined, options);
    return pickResource<AccountObject>(res, "account");
  }
}

const WebhooksBase = createResource<WebhookEndpointObject>({ path: "webhooks", singular: "endpoint", plural: "endpoints" });

export class WebhookEndpointsResource extends WebhooksBase {
  constructor(...args: ConstructorParameters<typeof BaseClient>) {
    super(...args);
  }

  async rotateSecret(id: string, options?: RequestOptions): Promise<WebhookEndpointObject> {
    const res = await this.post(`/webhooks/${encodeURIComponent(id)}/rotate-secret`, undefined, options);
    return pickResource<WebhookEndpointObject>(res, "endpoint");
  }
}
