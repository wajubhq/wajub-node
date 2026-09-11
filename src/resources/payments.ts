import type {
  CreatePaymentParams,
  PaymentListParams,
  PaymentObject,
  RequestOptions,
} from "../types.js";
import { BaseClient } from "../http.js";
import { pickList, pickResource } from "../http-utils.js";
import { createPagedList, type PagedResult } from "./pagination.js";

function toPaymentObject(body: Record<string, unknown>): PaymentObject {
  const transaction = pickResource<Record<string, unknown>>(body, "transaction");
  return {
    ...(transaction as PaymentObject),
    authorization_token: String(
      body.authorization_token ?? transaction.authorization_token ?? transaction.id ?? "",
    ),
    authorization_url: String(body.authorization_url ?? transaction.authorization_url ?? ""),
  } as PaymentObject;
}

export class PaymentsResource extends BaseClient {
  async create(params: CreatePaymentParams, options?: RequestOptions): Promise<PaymentObject> {
    const { idempotencyKey, ...rest } = params;
    const res = await this.post("/payments", rest as Record<string, unknown>, {
      ...options,
      idempotencyKey: options?.idempotencyKey ?? idempotencyKey,
    });
    return toPaymentObject(res);
  }

  async retrieve(id: string): Promise<PaymentObject> {
    const res = await this.get(`/payments/${encodeURIComponent(id)}`);
    return pickResource<PaymentObject>(res, "transaction");
  }

  async list(params?: PaymentListParams): Promise<PagedResult<PaymentObject>> {
    return createPagedList<PaymentObject>(this, "/payments", "transactions", params as Record<string, unknown>);
  }

  /** Cancel a pending payment (`DELETE /payments/{uid}`). */
  async cancel(id: string, options?: RequestOptions): Promise<PaymentObject> {
    const res = await this.del(`/payments/${encodeURIComponent(id)}`, options);
    return pickResource<PaymentObject>(res, "transaction");
  }

  /** Charge / process a payment (`POST /payments/{uid}`). */
  async process(id: string, params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post(`/payments/${encodeURIComponent(id)}`, params, options);
    return pickResource<Record<string, unknown>>(res, "transaction");
  }

  /** Process a split installment (`POST /payments/{uid}/splits`). */
  async processSplit(id: string, params: Record<string, unknown>, options?: RequestOptions) {
    const res = await this.post(`/payments/${encodeURIComponent(id)}/splits`, params, options);
    return pickResource<Record<string, unknown>>(res, "transaction");
  }

  /** List refunds for a payment (`GET /payments/{uid}/refunds`). */
  async listRefunds(id: string, params?: Record<string, unknown>) {
    const res = await this.get(`/payments/${encodeURIComponent(id)}/refunds`, params);
    return pickList<Record<string, unknown>>(res, "refunds");
  }
}
