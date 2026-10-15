# @wajub/node

[![npm version](https://img.shields.io/npm/v/@wajub/node.svg)](https://www.npmjs.com/package/@wajub/node)
[![Node.js](https://img.shields.io/node/v/@wajub/node)](https://www.npmjs.com/package/@wajub/node)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official server-side SDK for the [Wajub API](https://docs.wajub.com): create payments, confirm them, pay out and verify webhooks from your Node.js backend.

It runs on your server with a secret (`sk.…`, `sk_test.…`) or restricted (`rk.…`, `rk_test.…`) API key. Never expose these keys in client-side code: in the browser, use `@wajub/js` with your publishable key (`pk.…`, `pk_test.…`).

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 18 or later |

## Installation

```bash
npm install @wajub/node
```

## Quick start

Amounts are in the currency's **main unit**: `12.50` for GHS 12.50, `5000` for XAF 5,000.

```ts
import { Wajub } from "@wajub/node";

const wajub = new Wajub({
  apiKey: process.env.WAJUB_API_KEY!,
  webhookSecret: process.env.WAJUB_WEBHOOK_SECRET,
});

const payment = await wajub.payments.create({
  amount: 15000,
  currency: "XAF",
  email: "buyer@example.com",
  reference: "order-1042",
  callback: "https://shop.example.com/order/complete",
});

// Redirect the customer to payment.authorization_url,
// or mount payment.authorization_token with @wajub/js in your page.
```

Then confirm the result on your server: handle the `payment.succeeded` webhook, or call `wajub.payments.retrieve(payment.id)`.

## Configuration

| Option | Description |
|--------|-------------|
| `apiKey` | Secret or restricted API key (`sk.…`, `sk_test.…`, `rk.…`, `rk_test.…`). Required. |
| `webhookSecret` | Webhook signing secret (`whsec_…`), needed only for `webhooks.constructEvent()`. Falls back to `WAJUB_WEBHOOK_SECRET`. |
| `timeout` | Request timeout in milliseconds, also settable per call. |
| `fetchOptions` | A `RequestInit` merged into every call, for a proxy dispatcher for instance. |

The SDK does not read the API key from the environment: read `WAJUB_API_KEY` yourself and pass it as `apiKey`, as above.

## Resources

| Purpose | Getter | Methods |
|---------|--------|---------|
| Payments | `wajub.payments` | `create`, `retrieve`, `list`, `cancel`, `process`, `processSplit`, `listRefunds` |
| Refunds | `wajub.refunds` | `create`, `retrieve`, `list` |
| Customers | `wajub.customers` | `create`, `retrieve`, `update`, `delete`, `list`, `block`, `unblock`, `activate`, `deactivate`, `listTaxIds`, `createTaxId`, `deleteTaxId` |
| Payment links | `wajub.links` | `create`, `retrieve`, `update`, `delete`, `list` |
| Invoices | `wajub.invoices` | `create`, `retrieve`, `update`, `delete`, `list`, `send`, `markPaid`, `cancel` |
| Payouts | `wajub.transfers` | `create`, `retrieve`, `list` |
| Payout recipients | `wajub.beneficiaries` | `create`, `retrieve`, `update`, `delete`, `list` |
| Destination checks | `wajub.identity` | `resolve`, `validate` |
| Balance | `wajub.balance` | `retrieve` |
| Disputes | `wajub.disputes` | `list`, `retrieve`, `submitEvidence`, `accept`, `close`, `sendMessage` |
| Events | `wajub.events` | `list`, `retrieve`, `resend` |
| Webhook endpoints | `wajub.webhookEndpoints` | `create`, `retrieve`, `update`, `delete`, `list`, `rotateSecret` |
| Webhook verification | `wajub.webhooks` | `constructEvent` |
| Connected accounts (Sync) | `wajub.accounts` | `create`, `retrieve`, `update`, `delete`, `list`, `regenerateToken` |
| Tax | `wajub.tax` | `getSettings`, `updateSettings`, `rates`, `calculate`, `reports`, `listCodes`, `retrieveCode`, `listRegistrations`, `createRegistration`, `retrieveRegistration`, `updateRegistration`, `deleteRegistration`, `jurisdictions`, `thresholds`, `thresholdAlerts` |
| Fraud (Shield) | `wajub.shield` | `getSettings`, `updateSettings`, `stats`, `listBlocklist`, `addToBlocklist`, `removeFromBlocklist` |
| Reference data | `wajub.global` | `ping`, `channels`, `countries`, `currencies` |

## Acting for a connected account

Pass the connected account with `sync` on the call:

```ts
await wajub.payments.create(params, { sync: "acct_sync_ref" });
```

## Webhooks

Pass the **raw request body**, not parsed JSON, with the `X-Wajub-Signature` and `X-Wajub-Timestamp` headers:

```ts
import express from "express";

app.post("/webhooks/wajub", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const event = wajub.webhooks.constructEvent(
      req.body, // string | Buffer
      req.header("x-wajub-signature"),
      req.header("x-wajub-timestamp"),
    );

    if (event.event === "payment.succeeded") {
      // fulfil the order
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(400);
  }
});
```

A delivery that does not verify throws `WebhookSignatureVerificationError`. If your server's clock drifts, pass a tolerance in seconds as a fourth argument.

## Pagination

`list()` returns a page you can walk one page at a time, or iterate across all pages:

```ts
const page = await wajub.payments.list({ per_page: 50 });
console.log(page.data, page.meta, page.has_more);

if (page.has_more) {
  const next = await page.getNextPage();
}

for await (const payment of page) {
  console.log(payment.id, payment.status);
}
```

## Idempotency

Temporary failures are retried for you. To make a create safe to repeat on your side too, after a restart or in a job retry, pass your own key:

```ts
await wajub.payments.create(params, { idempotencyKey: `order-${orderId}` });
```

## Error handling

API errors throw a subclass of `WajubError`:

```ts
import { WajubError, WajubInvalidRequestError, WajubAuthenticationError } from "@wajub/node";

try {
  await wajub.payments.create(params);
} catch (err) {
  if (err instanceof WajubInvalidRequestError) {
    console.log(err.errors); // field-level validation errors
  } else if (err instanceof WajubAuthenticationError) {
    // check your API key
  } else if (err instanceof WajubError) {
    console.log(err.code, err.httpStatus, err.message);
  }
}
```

| Class | Raised on |
|-------|-----------|
| `WajubAuthenticationError` | `401`, `403` |
| `WajubInvalidRequestError` | `400`, `404`, `422` |
| `WajubPaymentError` | `402` |
| `WajubRateLimitError` | `429`, with `retryAfter` in seconds |
| `WajubApiError` | Any other error status |
| `WajubConnectionError` | No response: network error or timeout |

Every error carries `message`, `code`, `httpStatus`, `errors` (field-level messages) and `raw` (the response body).

## Testing

Use a sandbox key (`sk_test.…`): the key chooses the environment, and no real money moves. The test phone numbers and cards are on [Test scenarios](https://docs.wajub.com/developer-tools/testing/test-scenarios). To receive webhooks on your machine, forward them with the [Wajub CLI](https://docs.wajub.com/developer-tools/cli/listen).

## Documentation & support

- Documentation: [docs.wajub.com/libraries/sdks/nodejs](https://docs.wajub.com/libraries/sdks/nodejs)
- Report issues: [github.com/wajubhq/wajub-node/issues](https://github.com/wajubhq/wajub-node/issues)

## License

MIT — see [LICENSE](LICENSE).
