# Publishing API

**Status:** Draft — revised for the independent architecture (ADR-0004); not re-reviewed or approved
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) ·
[Authorization flow](AUTHORIZATION-FLOW.md) ·
[Channel and event flow](CHANNEL-AND-EVENT-FLOW.md)

> Endpoint paths, API version scheme, authentication scheme, signing algorithm,
> replay-protection mechanism, and response bodies are **not finalized**. They
> are **[DESIGN]** items (ADR-0009) and must be specified and approved before
> implementation.

## 1. Purpose

A project-owned, versioned, server-to-server HTTP interface that lets a
project's backend publish events to its own realtime deployment.

The server does not own or mutate business records. The backend publishes only
after its own business operation has succeeded.

## 2. Candidate operations

| Operation | Status |
|---|---|
| Publish one event to one channel | Expected in Release 1 |
| Publish one event to multiple channels | **[OPEN]** only if a requirement is established |
| Batch events | **[OPEN]** only if a requirement is established |
| Channel / occupancy queries | **[OPEN]** only if a requirement is established |
| Webhooks (outbound) | **[OPEN]** not in Release 1 unless required |

## 3. Request handling pipeline

```text
 HTTP request
   -> method / path / version / content-type check
   -> body size limit (reject before buffering excess)
   -> authenticate publisher: credential or signature [DESIGN]
   -> replay protection [DESIGN]
   -> validate body with Zod: channel name(s), event name, payload size
   -> rate limit
   -> hand validated event to Event dispatcher
   -> defined success or error response
```

Authentication steps run before any dispatch. Failures return distinct,
non-revealing errors and increment a rejected-request metric.

## 4. Authentication requirements

- Backend publishers are authenticated using deployment-specific server
  credentials or cryptographic request signatures **[DESIGN: which, and
  algorithm]**.
- If signatures are used, verify with `node:crypto` and constant-time
  comparison, and include integrity coverage of the request body.
- Replay protection **[DESIGN]**: for example a bounded timestamp window and/or
  nonce tracking; the chosen mechanism must work within in-memory, single-instance
  state and be revisited for multi-instance deployments.
- Unknown credentials are rejected.
- Never log the secret, signature, credential, or request body.

## 5. Validation and limits

- Channel names and event name: allowed characters and maximum length.
- Payload: maximum size and valid encoding.
- Maximum channels per request and request body size **[OPEN values]**.
- Rate limits per deployment/credential **[OPEN]**.

## 6. Semantics

- A successful response means the event was accepted and handed to local
  dispatch, **not** that any client received it.
- Publishing to a channel with no subscribers succeeds.
- No idempotency, deduplication, persistence, or retry by the server. If the
  backend needs retries, duplicates are possible and clients must tolerate them
  (idempotency-key support **[OPEN]**).

## 7. Error responses

A defined, versioned error model **[DESIGN]**. Errors must never include
secrets, expected values, internal paths, or stack traces.

## 8. Operational endpoints (separate from publishing)

`GET /health`, `GET /ready`, `GET /internal/stats` are specified in
[DEPLOYMENT-ARCHITECTURE.md](DEPLOYMENT-ARCHITECTURE.md) and
[SECURITY.md](SECURITY.md). They must stay logically separate from the
publishing router and must be restricted.

## 9. Testing plan

Positive tests from a reference backend client, plus negative tests: bad
credential or signature, replayed request, tampered body, oversize body, invalid
channel/event name, unknown credential, unsupported API version.

## 10. Open and design items

- **[DESIGN]** Endpoints, API version scheme, authentication scheme and algorithm.
- **[DESIGN]** Replay-protection mechanism.
- **[DESIGN]** Request, response, and error formats.
- **[DESIGN]** Credential rotation.
- **[OPEN]** Multi-channel, batch, and exclusion needs.
- **[OPEN]** Payload and request size limits, rate limits.
- **[OPEN]** Whether a first-party backend helper library is provided.
