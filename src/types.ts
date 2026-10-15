/** Wajub merchant API types — aligned with api.wajub/docs/API_REFERENCE.md */

export interface AddressInput {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API object interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerObject {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: AddressInput | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface RefundObject {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface TransferObject {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string | null;
  description?: string | null;
  beneficiary?: BeneficiaryObject | Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface BeneficiaryObject {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  channel?: string | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface LinkObject {
  id: string;
  name?: string | null;
  amount?: number | null;
  currency?: string | null;
  url?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface InvoiceObject {
  id: string;
  number?: string | null;
  status: string;
  amount: number;
  currency: string;
  customer?: CustomerObject | Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface BalanceObject {
  available?: number | null;
  pending?: number | null;
  currency?: string | null;
  [key: string]: unknown;
}

export interface EventObject {
  id: string;
  type: string;
  data: Record<string, unknown>;
  pending_webhooks?: number;
  sandbox?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface DisputeObject {
  id: string;
  payment_id?: string | null;
  status: string;
  reason?: string | null;
  amount?: number | null;
  currency?: string | null;
  evidence?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface IdentityObject {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  provider?: string | null;
  [key: string]: unknown;
}

export interface AccountObject {
  id: string;
  name?: string | null;
  email?: string | null;
  token?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface WebhookEndpointObject {
  id: string;
  url: string;
  enabled_events?: string[];
  status?: string | null;
  secret?: string | null;
  metadata?: Record<string, unknown> | null;
  sandbox?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface TaxObject {
  id?: string | null;
  rate?: number | null;
  country?: string | null;
  type?: string | null;
  [key: string]: unknown;
}

export interface ShieldObject {
  blocked?: boolean;
  reason?: string | null;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing types (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What a payment, a link or an invoice may be paid with. Every key is
 * optional and narrows nothing when left out: by default the payer is offered
 * every method the merchant can collect on.
 */
export interface PaymentAccept {
  /** Only channels of these countries (ISO 3166-1 alpha-2). Cards and crypto are not tied to a country. */
  countries?: string[];
  /** Only these channels, e.g. `cm.mtn`; `cm.mobile` stands for every mobile operator of Cameroon. */
  channels?: string[];
  /** Only these kinds of channel, e.g. `mobile_money`, `card`. */
  types?: string[];
  /** `payment`: only channels settling in the payment's currency. `any` (default): converted when they differ. */
  currencies?: "payment" | "any";
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  email?: string;
  phone?: string;
  name?: string;
  reference?: string;
  description?: string;
  /** Redirect checkout only — omit for inline / overlay embed. */
  callback?: string;
  /** How long the payment stays open: `{ in: minutes }`, 5 to 43 200 (default 1 440, a day). */
  expires?: { in?: number };
  /**
   * @deprecated The API reads `expires.in`. Kept so existing calls still work:
   * the SDK sends it as `expires.in` when `expires` is not set.
   */
  expires_in?: number;
  bearer?: "merchant" | "customer";
  /** Restrict the payment methods offered to the payer. */
  accept?: PaymentAccept;
  customer_id?: string | null;
  customer?: string | {
    name?: string;
    email?: string;
    phone?: string;
    address?: AddressInput;
    metadata?: Record<string, unknown>;
  };
  address?: AddressInput;
  shipping?: AddressInput;
  items?: { name?: string; description?: string; quantity?: number; unit_price?: number }[];
  /**
   * @deprecated Has no effect: the payment page shows your account's branding,
   * set in the Wajub Dashboard. Kept so existing calls still compile.
   */
  theming?: { primary_color?: string; logo_url?: string };
  metadata?: Record<string, unknown>;
  /** Auto-generated when omitted on create(). */
  idempotencyKey?: string;
}

export interface PaymentObject {
  id: string;
  reference: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  status: string;
  description?: string | null;
  authorization_token: string;
  authorization_url: string;
  customer?: CustomerObject | Record<string, unknown> | null;
  callback?: string | null;
  sandbox?: boolean;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ListMeta {
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
}

export interface PaymentListParams {
  per_page?: number;
  page?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

/** A webhook delivery as the API sends it. */
export interface WebhookEvent {
  /** The event's id, `evt_…`: deduplicate on it. */
  id: string;
  /** The event type, for example `payment.succeeded`. */
  event: string;
  /** The object the event is about (payment, refund, transfer…). */
  data: Record<string, unknown>;
  /** `false` for a sandbox event. */
  livemode?: boolean;
  pending_webhooks?: number;
  api_version?: string | null;
  request?: { id?: string | null; idempotency_key?: string | null };
  /** When the event happened, ISO 8601. */
  created?: string;
  [key: string]: unknown;
}

export interface WajubConfig {
  /** Secret API key (`sk.` / `sk_test.`) — alias: `secretKey` */
  apiKey?: string;
  secretKey?: string;
  /** Webhook signing secret (`whsec_` / `whsec_test_`) for `webhooks.constructEvent`. */
  webhookSecret?: string;
  /** Extra fetch init (proxy dispatcher, dev TLS, etc.). */
  fetchOptions?: RequestInit;
  /** Default Idempotency-Key prefix for mutating calls when not passed per-request. */
  idempotencyKeyPrefix?: string;
  /** Default per-request timeout in milliseconds. Overridable per-call via `RequestOptions.timeout`. Default: 30000 (30s). */
  timeout?: number;
}

export type RequestOptions = {
  idempotencyKey?: string;
  headers?: Record<string, string>;
  /** Sync (Connect) account reference — sends `X-Sync` header. */
  sync?: string;
  /** Overrides the client-wide default request timeout (ms) for this call. */
  timeout?: number;
};
