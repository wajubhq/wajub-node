# @wajub/node

[![npm version](https://img.shields.io/npm/v/@wajub/node.svg)](https://www.npmjs.com/package/@wajub/node)
[![Node.js](https://img.shields.io/node/v/@wajub/node)](https://www.npmjs.com/package/@wajub/node)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official **server-side** SDK for the [Wajub merchant API](https://docs.wajub.com). Accept mobile-money and card payments across Africa with a Stripe-inspired, resource-oriented client.

Use **`@wajub/js`** (+ `@wajub/react`) in the browser. Use **`@wajub/node`** on your backend with a secret (`sk_`) or restricted (`rk_`) API key — never expose secret keys in client-side code.

## Features

- Resource-oriented API (`wajub.payments`, `wajub.customers`, …)
- Automatic `Idempotency-Key` on mutating requests (override per call)
- Typed errors per HTTP status
- Automatic retries on 429 and 5xx (max 2, exponential backoff)
- Page-based pagination with async iteration and `getNextPage()`
- Webhook signature verification (HMAC-SHA256, timestamp tolerance)
- Zero third-party runtime dependencies (stdlib only)

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 18 or later |

## Installation

```bash
npm install @wajub/node
```

## Quick start

Amounts are passed in the **smallest currency unit** (e.g. cents for EUR/USD; whole francs for XAF).

```ts
import { Wajub } from "@wajub/node";

const wajub = new Wajub({
  secretKey: process.env.WAJUB_SECRET_KEY!,
  // webhookSecret: process.env.WAJUB_WEBHOOK_SECRET,
});

// Redirect checkout
const payment = await wajub.payments.create({
  amount: 15000,
  currency: "XAF",
  email: "buyer@example.com",
  callback: "https://shop.example.com/order/complete",
});

// Inline / overlay — no callback URL
const embed = await wajub.payments.create({
  amount: 15000,
  currency: "XAF",
  metadata: { mode: "embed" },
});

console.log(embed.authorization_token, embed.authorization_url);
```

## Configuration

| Variable | Description |
|----------|-------------|
| `WAJUB_SECRET_KEY` / `WAJUB_API_KEY` | Secret or restricted API key (`sk_`, `sk_test.`, `rk_`, …) |
| `WAJUB_WEBHOOK_SECRET` | Webhook signing secret (`whsec_`) for `constructEvent()` |
| `WAJUB_API_URL` | Override API base URL (development/staging only — see below) |

Test mode is selected by your API key prefix (`sk_test.…`), not by the API URL. Production calls always go to `https://api.wajub.com` unless `WAJUB_API_URL` is set.

## Resources (merchant API)

| Getter | Methods |
|--------|---------|
| `wajub.global` | `ping`, `channels`, `countries`, `currencies` |
| `wajub.payments` | `create`, `retrieve`, `list`, `cancel`, `process`, `processSplit`, `listRefunds` |
| `wajub.customers` | `create`, `retrieve`, `update`, `delete`, `list`, `block`, `unblock`, `activate`, `deactivate`, `listTaxIds`, `createTaxId`, `deleteTaxId` |
| `wajub.refunds` | `create`, `retrieve`, `list` |
| `wajub.transfers` | `create`, `retrieve`, `list` |
| `wajub.beneficiaries` | `create`, `retrieve`, `update`, `delete`, `list` |
| `wajub.links` | `create`, `retrieve`, `update`, `delete`, `list` |
| `wajub.invoices` | `create`, `retrieve`, `update`, `delete`, `list`, `send`, `markPaid`, `cancel` |
| `wajub.accounts` | `create`, `retrieve`, `update`, `delete`, `list`, `regenerateToken` |
| `wajub.webhookEndpoints` | `create`, `retrieve`, `update`, `delete`, `list`, `rotateSecret` |
| `wajub.balance` | `retrieve` |
| `wajub.events` | `list`, `retrieve`, `resend` |
| `wajub.disputes` | `list`, `retrieve`, `submitEvidence`, `accept`, `close`, `sendMessage` |
| `wajub.identity` | `resolve`, `validate` |
| `wajub.tax` | `getSettings`, `updateSettings`, `rates`, `calculate`, `reports`, `listCodes`, `retrieveCode`, `listRegistrations`, `createRegistration`, `retrieveRegistration`, `updateRegistration`, `deleteRegistration`, `jurisdictions`, `thresholds`, `thresholdAlerts` |
| `wajub.shield` | `getSettings`, `updateSettings`, `stats`, `listBlocklist`, `addToBlocklist`, `removeFromBlocklist` |
| `wajub.listen` | `config`, `auth` |
| `wajub.webhooks` | `constructEvent` (local — no HTTP) |

## Sync (Connect)

Pass a connected account reference on any mutating call:

```ts
await wajub.payments.create(params, { sync: "acct_sync_ref" });
```

## Webhooks (Express / Next.js)

Use the **raw request body** — not parsed JSON:

```ts
const event = wajub.webhooks.constructEvent(
  rawBody, // string | Buffer
  req.headers["x-wajub-signature"] as string,
  req.headers["x-wajub-timestamp"] as string,
);

switch (event.type) {
  case "payment.succeeded":
    // fulfill order
    break;
}
```

During local development, use the [Wajub CLI](https://github.com/wajubhq/wajub-cli) to forward webhooks to your machine.

## Pagination

List methods return a `PagedResult<T>` that implements `AsyncIterable`. Use `for await` to iterate through every item across all pages:

```ts
for await (const payment of await wajub.payments.list({ per_page: 50 })) {
  console.log(payment.id, payment.status);
}

// Manual pagination
const firstPage = await wajub.payments.list();
console.log(firstPage.data, firstPage.meta, firstPage.has_more);

if (firstPage.has_more) {
  const secondPage = await firstPage.getNextPage();
}
```

## Idempotency

`payments.create()` (and other POST/PUT) automatically sends an `Idempotency-Key` header. Pass your own:

```ts
await wajub.payments.create(params, { idempotencyKey: `order-${orderId}` });
```

## Error handling

API errors throw typed exceptions you can catch by `status` or `code`:

```ts
import { WajubInvalidRequestError, WajubAuthenticationError } from "@wajub/node";

try {
  await wajub.payments.create(params);
} catch (err) {
  if (err instanceof WajubInvalidRequestError) {
    console.log(err.errors); // field-level validation errors
  } else if (err instanceof WajubAuthenticationError) {
    // 401 — bad API key
  }
}
```

## Local development / staging

Point the SDK at a local or staging API server without modifying source code:

```bash
# local dev server
WAJUB_API_URL=http://localhost:8000 node server.js

# staging environment
WAJUB_API_URL=https://api.staging.wajub.com node server.js
```

The SDK reads this variable at startup and strips trailing slashes. Omit it in production so calls always reach `https://api.wajub.com`.

## Development

```bash
npm test
npm run build
```

## Documentation & support

- Full API reference: [docs.wajub.com/libraries/sdks/nodejs](https://docs.wajub.com/libraries/sdks/nodejs)
- Report issues: [github.com/wajubhq/wajub-node/issues](https://github.com/wajubhq/wajub-node/issues)

## License

MIT — see [LICENSE](LICENSE).
