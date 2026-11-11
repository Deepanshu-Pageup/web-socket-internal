# Publishing API

**Status:** Draft — not reviewed or approved (Phase 01 not started)
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) ·
[Authorization flow](AUTHORIZATION-FLOW.md) ·
[Channel and event flow](CHANNEL-AND-EVENT-FLOW.md)

> Endpoint paths, query parameters, signing algorithm, and response bodies must
> **not** be finalized until existing company backend SDK usage has been
> inspected (Phase 00) and checked against official Pusher documentation. Only
> the operations actually used by company backends, or by an approved migration
> adapter, are in scope. All specifics below are **[VERIFY]**.

## 1. Purpose

A server-to-server HTTP interface that lets a project's backend publish events to
its own realtime deployment, compatible with the subset of Pusher's HTTP API
that its existing backend SDK uses.

The server does not own or mutate business records. The backend publishes only
after its own business operation has succeeded.

## 2. Candidate operations

| Operation | Status |
|---|---|
| Publish one event to one channel | Expected (subject to discovery) |
| Publish one event to multiple channels | **[OPEN]** only if used |
| Batch events | **[OPEN]** only if used |
| Channel / occupancy / user queries | **[OPEN]** only if used |
| Webhooks (outbound) | **[OPEN]** not in Release 1 unless evidenced |

## 3. Request handling pipeline

```text
 HTTP request
   -> method / path / content-type check
   -> body size limit (reject before buffering excess)
   -> authenticate: key, timestamp window, body digest, signature [VERIFY]
   -> validate body with Zod: channel name(s), event name, payload size
   -> rate limit
   -> hand validated event to Event dispatcher
   -> compatible success or error response
```

Authentication steps run before any dispatch. Failures return distinct,
non-revealing errors and increment a rejected-request metric.

## 4. Authentication requirements

- Verify the publisher signature using the deployment's app secret via
  `node:crypto`, with constant-time comparison.
- Verify the timestamp is within a configured tolerance to limit replay
  **[OPEN tolerance]**.
- Verify the request body integrity value if the compatible scheme includes one
  **[VERIFY]**.
- Unknown application key is rejected.
- Never log the secret, signature, or request body.

## 5. Validation and limits

- Channel names and event name: allowed characters and maximum length.
- Payload: maximum size, valid encoding, as required by the compatible format.
- Maximum channels per request and request body size **[OPEN values]**.
- Rate limits per deployment/credential **[OPEN]**.

## 6. Semantics

- A successful response means the event was accepted and handed to local
  dispatch, **not** that any client received it.
- Publishing to a channel with no subscribers succeeds.
- No idempotency, deduplication, persistence, or retry by the server. If the
  backend needs retries, duplicates are possible and clients must tolerate them
  (idempotency-key support **[OPEN]**).
- Excluded-socket parameter is supported only if existing backends use it.

## 7. Error responses

Use status codes and bodies compatible with the targeted SDK behavior
**[VERIFY]**. Errors must never include secrets, expected signatures, internal
paths, or stack traces.

## 8. Operational endpoints (separate from publishing)

`GET /health`, `GET /ready`, `GET /internal/stats` are specified in
[DEPLOYMENT-ARCHITECTURE.md](DEPLOYMENT-ARCHITECTURE.md) and
[SECURITY.md](SECURITY.md). They must stay logically separate from the
publishing router and must be restricted.

## 9. Compatibility testing plan

Run the company's actual backend SDK versions (from Phase 00 inventory) against
the server, plus negative tests: bad signature, stale timestamp, tampered body,
oversize body, invalid channel/event name, unknown key.

## 10. Open items

- **[OPEN]** Which backend SDKs and versions, and which operations they call.
- **[OPEN]** Exact endpoints, signing scheme, and error format.
- **[OPEN]** Multi-channel, batch, and exclusion needs.
- **[OPEN]** Payload and request size limits, rate limits, timestamp tolerance.
- **[OPEN]** Whether a migration adapter is needed instead of full SDK compatibility.
