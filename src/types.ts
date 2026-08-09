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
  expires_in?: number;
  bearer?: "merchant" | "customer";
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

export interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
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
