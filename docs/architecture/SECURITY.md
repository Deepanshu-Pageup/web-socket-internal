# Security Architecture

**Status:** Draft — not reviewed or approved (Phase 01 not started)
**Related:** [Authorization flow](AUTHORIZATION-FLOW.md) ·
[Publishing API](PUBLISHING-API.md) ·
[Deployment architecture](DEPLOYMENT-ARCHITECTURE.md)

> These are design requirements derived from the product specification. No
> control below is claimed as implemented or tested. A security property may be
> asserted only after a test demonstrates it.

## 1. Assets and trust boundaries

| Asset | Where it lives |
|---|---|
| Application secret | Backend and realtime server only; never clients |
| Event payloads | Possibly sensitive; in transit and in memory only |
| Connection/channel state | Server memory, per deployment |

| Boundary | Trust level |
|---|---|
| Browser/mobile clients | Untrusted; all input validated |
| Consuming backend | Trusted only after signature verification |
| Other deployments | Fully isolated |
| Operational callers | Restricted to internal network/access control |

## 2. Threats and required mitigations

| Threat | Mitigation |
|---|---|
| Secret exposure | Server-side only; never in client code, logs, errors, fixtures, or committed config; placeholders in examples |
| Unauthorized channel subscription | Independent signature verification for protected channels; constant-time compare; socket ID from server record |
| Forged or replayed publish request | Signature and timestamp-window verification; body integrity check if scheme includes it |
| Cross-site WebSocket hijacking | Origin allow-list at upgrade (defense in depth) |
| Cross-channel / cross-deployment leakage | Per-deployment state; exact-name channel lookup; isolation tests |
| Resource exhaustion (memory/CPU) | Connection, message, request, and subscription limits; rate limits; bounded outbound buffers |
| Slow-client attack | Terminate connections exceeding buffer bounds; never block other deliveries |
| Malformed input / injection | Zod validation at every boundary; validate channel and event names; unknown input typed as `unknown` until narrowed |
| Information disclosure via errors | Generic protocol-compatible errors; no stack traces, expected signatures, or internals |
| Sensitive data in logs | Structured Pino logs; redaction; never log secrets, signatures, auth payloads, or event bodies |
| Exposed operational endpoints | Restrict `/internal/stats`; no secrets or per-connection data; keep off the public endpoint |
| Stale state after shutdown/disconnect | Idempotent cleanup of connections, subscriptions, timers |
| Transport interception | TLS (`wss`/HTTPS) in production |
| Supply chain | `package-lock.json`, `npm ci`, minimal dependencies per the approved baseline; review any new dependency |

## 3. Authentication and authorization

Summarized in [AUTHORIZATION-FLOW.md](AUTHORIZATION-FLOW.md). Key points: the
backend decides who may access what; the server only verifies signatures. Channel
authorization and publisher authentication use separate verification paths.

## 4. Secrets management

- Supplied at deploy time by environment or orchestrator secret mechanism.
- Not baked into images, committed, or printed on startup.
- Configuration errors report which setting is invalid, never its value.
- Rotation and multi-secret support **[OPEN]**.

## 5. Logging and metrics policy

Allowed: counts, sizes, durations, connection IDs, channel type, failure
category. Forbidden: secrets, signatures, auth payloads, event payloads, full
request bodies. Metrics follow specification section 12.

## 6. Delivery guarantees (security-relevant honesty)

The system is best-effort and non-durable. Security-sensitive or
correctness-critical state must be verified against the consuming backend, not
trusted from realtime events alone.

## 7. Required security tests (when implementation is authorized)

Invalid and tampered signatures; unauthorized subscriptions; origin rejection;
oversized messages and requests; rate limiting; slow consumers and backpressure;
unexpected disconnects; graceful shutdown; no cross-project or cross-channel
leakage; no secrets in logs or error responses.

## 8. Open items

- **[OPEN]** Missing-`Origin` policy; per-deployment origin configuration.
- **[OPEN]** Rate-limit model and numeric limits.
- **[OPEN]** Access control mechanism for operational endpoints.
- **[OPEN]** Secret rotation procedure.
- **[OPEN]** Formal threat-model review and approval (Phase 01).
