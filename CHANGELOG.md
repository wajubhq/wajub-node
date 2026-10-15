# Changelog

All notable changes to `@wajub/node` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
`@wajub/node` uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] — 2026-10-15

### Deprecated
- **`listen.config()` and `listen.auth()`.** The API no longer offers them. To
  receive webhooks on your machine, forward them with the Wajub CLI:
  `wajub listen`. Your editor marks them as deprecated, and Node prints a
  `DeprecationWarning` the first time each one is called.

## [2.0.0] — 2026-10-12

Results are typed objects again (`PaymentObject`, `TransferObject`, …) where
1.5.0 returned plain records. It is a major version because TypeScript code
written against 1.5.0 can meet new type errors.

### Migrating from 1.5.0
- Results are typed objects; read fields as before, but code that typed them as
  `Record<string, unknown>` may need its annotations changed.
- `payments.initialize` is gone: call `payments.create`.
- `WebhookEvent` carries the type in `event`, not `type`.

### Fixed
- **`webhooks.constructEvent()` always checks the timestamp.** A tolerance that
  is not a positive number (a secret passed by mistake in its place, `NaN`,
  `0`) switched the check off, so a replayed delivery was accepted. Such a
  value now keeps the default tolerance.
- **A missing `X-Wajub-Signature` or `X-Wajub-Timestamp` header** raises
  `WebhookSignatureVerificationError` instead of a `TypeError`, so your handler
  answers 400, not 500.
- **`WebhookEvent` describes what a delivery carries:** `id`, `event` (the
  type), `data`, `created`, `livemode`, `pending_webhooks`, `api_version`,
  `request`. It declared `type`, which deliveries never carry: read
  `event.event`.
- **Payment expiry:** `CreatePaymentParams` gains `expires: { in: minutes }`.
  An `expires_in` you already pass now takes effect too; it was ignored.

### Changed
- **A create sent again with the same idempotency key while the first is still
  running** now returns the first request's result instead of a `409` error.

## [1.1.1] — 2026-08-09

### Changed
- README corrections; no change to the package.

## [1.1.0] — 2026-08-09

### Added
- **Automatic retries** — temporary failures (rate limits, server errors) are
  retried for you.
- **Typed object interfaces** — `PaymentObject`, `CustomerObject`,
  `TransferObject`, `RefundObject`, `InvoiceObject`, and the other domain
  types are exported from the package root so you can annotate your own
  variables.
- **Auto-pagination** — `PagedResult<T>` is an `AsyncIterable`. Use
  `for await (const item of await wajub.payments.list())` to walk every page
  without calling `getNextPage()`.

### Fixed
- **Every validation message is kept** — the `errors` field of `WajubError`
  kept only the first message per field. It now holds all of them, as
  `string[]`.

---

## [1.0.0] — 2026-07-01

### Added
- Initial release of `@wajub/node`, the server-side Wajub SDK for Node.js 18+
  and Edge runtimes.
- `Wajub` class with resource accessors: `payments`, `customers`, `refunds`,
  `transfers`, `beneficiaries`, `links`, `invoices`, `accounts`,
  `webhookEndpoints`, `balance`, `events`, `disputes`, `identity`, `tax`,
  `shield`, `global`, `webhooks`.
- `webhooks.constructEvent()` — webhook signature verification with a
  configurable timestamp tolerance.
- Your own idempotency key per call, a configurable timeout and `fetchOptions`.
- `PagedResult<T>` for list methods.
- Full TypeScript support — strict types, no `any` in the public API.

[1.1.1]: https://github.com/wajubhq/wajub-node/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/wajubhq/wajub-node/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/wajubhq/wajub-node/releases/tag/v1.0.0
