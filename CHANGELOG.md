# Changelog

All notable changes to `@wajub/node` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
`@wajub/node` uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.0] — 2026-10-12

Versions 1.2.0 to 1.5.0 were published from a tree that is not in this
repository; 1.6.0 is built from this repository and carries the typed objects
of 1.1.x (`PaymentObject`, `TransferObject`, …) where 1.5.0 returned plain
records. `payments.initialize` is not part of it: call `create`.

### Fixed
- **`webhooks.constructEvent()` keeps the replay window.** A tolerance that is
  not a positive number (a secret passed by mistake in its place, `NaN`, `0`)
  switched the timestamp check off, so a replayed delivery was accepted. It now
  falls back to 300 seconds, like the other SDKs.
- **A missing `X-Wajub-Signature` or `X-Wajub-Timestamp` header** raises
  `WebhookSignatureVerificationError` instead of a `TypeError`, so your handler
  answers 400, not 500.
- **`WebhookEvent` describes what the API sends:** `id`, `event` (the type),
  `data`, `created`, `livemode`, `pending_webhooks`, `api_version`, `request`.
  It declared `type`, which deliveries never carry: read `event.event`.
- **Payment expiry:** `CreatePaymentParams` gains `expires: { in: minutes }`,
  the field the API reads. The old `expires_in` was ignored by the API; the SDK
  now sends it as `expires.in`.

### Changed
- **A `409` for an `Idempotency-Key` still being processed is retried.** A
  call sent again after a timeout can reach the API while the first one is
  still running; the API answers `409` with `errors.idempotency_key`. The SDK
  now waits 2, 4, then 8 seconds and asks again with the same key, within its
  usual 3 retries, and returns the first request's result. Every other `409`
  is still raised at once.

## [1.1.1] — 2026-08-09

### Changed
- Removed an internal API-surface note from the README that wasn't meant for public docs.

## [1.1.0] — 2026-08-09

### Added
- **Retry logic** — `GET` and `DELETE` requests, plus `POST`/`PUT` with an
  idempotency key, are automatically retried on transient failures (HTTP 429,
  500, 502, 503, 504) using exponential back-off with jitter (up to 3
  retries). `Retry-After` headers from 429 responses are honoured.
- **`User-Agent` header** — every request now includes
  `User-Agent: wajub-node/<version>` so server logs can distinguish SDK
  traffic from direct HTTP calls. The version is injected at build time via
  `tsup` define; falls back to `dev` in unit-test environments.
- **`WAJUB_API_URL` environment variable** — set this variable to point the
  SDK at a staging or locally-tunnelled endpoint without modifying source
  code. Trailing slashes are stripped automatically.
- **Typed object interfaces** — `PaymentObject`, `CustomerObject`,
  `TransferObject`, `RefundObject`, `InvoiceObject`, and the other domain
  types are now exported from the package root so callers can annotate their
  own variables without importing from internal paths.
- **Auto-pagination `AsyncIterable`** — `PagedResult<T>` now implements
  `[Symbol.asyncIterator]()`. Use `for await (const item of await
  wajub.payments.list())` to stream all pages without manual
  `getNextPage()` calls.

### Fixed
- **Error arrays preserved in full** — the `errors` field on `WajubError`
  subclasses previously discarded all but the first validation message per
  field. All messages are now kept as `string[]`, matching the shape the
  Wajub API actually sends.

---

## [1.0.0] — 2026-07-01

### Added
- Initial release of `@wajub/node` — official server-side Wajub SDK for
  Node.js 18+ and Edge runtimes.
- `Wajub` class with typed resource accessors: `payments`, `customers`,
  `refunds`, `transfers`, `beneficiaries`, `links`, `invoices`, `accounts`,
  `webhookEndpoints`, `balance`, `events`, `disputes`, `identity`, `tax`,
  `shield`, `listen`, `global`, `webhooks`.
- `WebhooksResource.constructEvent()` — HMAC-SHA-256 signature verification
  with timestamp replay-attack protection (configurable tolerance window).
- `BaseClient` with `GET`, `POST`, `PUT`, `DELETE` helpers, auto-generated
  `Idempotency-Key` headers for mutating requests, configurable timeout and
  `fetchOptions` pass-through.
- `createPagedList()` / `PagedResult<T>` for cursor-based list endpoints.
- Full TypeScript support — strict types, no `any` in public API surface.
- ESM-only build targeting Node.js 18 + modern Edge runtimes.

[1.1.1]: https://github.com/wajubhq/wajub-node/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/wajubhq/wajub-node/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/wajubhq/wajub-node/releases/tag/v1.0.0
