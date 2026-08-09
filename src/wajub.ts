import type { WajubConfig } from "./types.js";
import { defaultApiUrl, normalizeApiKey } from "./http-utils.js";
import { PaymentsResource } from "./resources/payments.js";
import {
  AccountsResource,
  BalanceResource,
  BeneficiariesResource,
  CustomersResource,
  DisputesResource,
  EventsResource,
  GlobalResource,
  IdentityResource,
  InvoicesResource,
  LinksResource,
  ListenResource,
  RefundsResource,
  ShieldResource,
  TaxResource,
  TransfersResource,
  WebhookEndpointsResource,
} from "./resources/index.js";
import { WebhooksResource } from "./webhooks.js";

export type { WajubConfig } from "./types.js";

/**
 * Wajub server SDK — Stripe-like entry point for Node.js / Edge runtimes with fetch.
 *
 * ```ts
 * import { Wajub } from "@wajub/node";
 * const wajub = new Wajub({ secretKey: process.env.WAJUB_SECRET_KEY! });
 * const payment = await wajub.payments.create({ amount: 15000, currency: "XAF" });
 * ```
 */
export class Wajub {
  readonly global: GlobalResource;
  readonly payments: PaymentsResource;
  readonly customers: CustomersResource;
  readonly refunds: InstanceType<typeof RefundsResource>;
  readonly transfers: InstanceType<typeof TransfersResource>;
  readonly beneficiaries: InstanceType<typeof BeneficiariesResource>;
  readonly links: InstanceType<typeof LinksResource>;
  readonly balance: BalanceResource;
  readonly events: EventsResource;
  readonly accounts: AccountsResource;
  readonly webhookEndpoints: WebhookEndpointsResource;
  readonly invoices: InvoicesResource;
  readonly disputes: DisputesResource;
  readonly identity: IdentityResource;
  readonly tax: TaxResource;
  readonly shield: ShieldResource;
  readonly listen: ListenResource;
  readonly webhooks: WebhooksResource;

  constructor(config: WajubConfig) {
    const apiKey = normalizeApiKey(config.secretKey ?? config.apiKey ?? "");
    if (!apiKey) {
      throw new Error("Wajub: secretKey (or apiKey) is required");
    }

    const baseUrl = defaultApiUrl();
    const opts = config.fetchOptions;
    const prefix = config.idempotencyKeyPrefix;
    const timeout = config.timeout;

    this.global = new GlobalResource(apiKey, baseUrl, opts, prefix, timeout);
    this.payments = new PaymentsResource(apiKey, baseUrl, opts, prefix, timeout);
    this.customers = new CustomersResource(apiKey, baseUrl, opts, prefix, timeout);
    this.refunds = new RefundsResource(apiKey, baseUrl, opts, prefix, timeout);
    this.transfers = new TransfersResource(apiKey, baseUrl, opts, prefix, timeout);
    this.beneficiaries = new BeneficiariesResource(apiKey, baseUrl, opts, prefix, timeout);
    this.links = new LinksResource(apiKey, baseUrl, opts, prefix, timeout);
    this.balance = new BalanceResource(apiKey, baseUrl, opts, prefix, timeout);
    this.events = new EventsResource(apiKey, baseUrl, opts, prefix, timeout);
    this.accounts = new AccountsResource(apiKey, baseUrl, opts, prefix, timeout);
    this.webhookEndpoints = new WebhookEndpointsResource(apiKey, baseUrl, opts, prefix, timeout);
    this.invoices = new InvoicesResource(apiKey, baseUrl, opts, prefix, timeout);
    this.disputes = new DisputesResource(apiKey, baseUrl, opts, prefix, timeout);
    this.identity = new IdentityResource(apiKey, baseUrl, opts, prefix, timeout);
    this.tax = new TaxResource(apiKey, baseUrl, opts, prefix, timeout);
    this.shield = new ShieldResource(apiKey, baseUrl, opts, prefix, timeout);
    this.listen = new ListenResource(apiKey, baseUrl, opts, prefix, timeout);

    const webhookSecret = config.webhookSecret ?? process.env.WAJUB_WEBHOOK_SECRET ?? "";
    this.webhooks = new WebhooksResource(webhookSecret);
  }

  static create(config: WajubConfig): Wajub {
    return new Wajub(config);
  }
}

export default Wajub;
