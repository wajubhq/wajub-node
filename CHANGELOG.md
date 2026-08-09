# Changelog

All notable changes to `@wajub/node` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
`@wajub/node` uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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

[1.1.0]: https://github.com/wajubhq/wajub-node/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/wajubhq/wajub-node/releases/tag/v1.0.0
