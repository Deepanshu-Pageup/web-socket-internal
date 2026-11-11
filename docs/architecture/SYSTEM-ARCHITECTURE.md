# System Architecture

**Status:** Draft — revised for the independent architecture (ADR-0004); not re-reviewed or approved
**Source of truth:** `roadmap/Internal-Realtime-Server-Product-Specification.md`
**Related:** [Connection lifecycle](CONNECTION-LIFECYCLE.md) ·
[Channel and event flow](CHANNEL-AND-EVENT-FLOW.md) ·
[Authorization flow](AUTHORIZATION-FLOW.md) · [Publishing API](PUBLISHING-API.md) ·
[Deployment architecture](DEPLOYMENT-ARCHITECTURE.md) · [Security](SECURITY.md)

> This document is not an approved design. Items marked **[DESIGN]** are design
> items that require review and approval and must not be treated as decided.
> Items marked **[OPEN]** depend on requirements evidence. Nothing here
> authorizes implementation.

## 1. Purpose and scope

A reusable, self-hosted, independent realtime system: a WebSocket server with
its own versioned application protocol, a first-party TypeScript client SDK, and
a versioned HTTP publishing API. One shared source repository produces a
versioned Docker image; each consuming project deploys its own independent
instance. The server is a generic infrastructure component and contains no
project-specific business logic.

### Non-goals

Public SaaS, multi-tenant service, workspace/billing/identity management,
durable queue or event store, Socket.IO, compatibility with any third-party
realtime service's protocol or SDKs, and (in the first release) Redis,
PostgreSQL, Kubernetes, or a management dashboard.

## 2. Baseline (from the specification)

| Area | Decision |
|---|---|
| Runtime / language | Node.js 24 LTS, strict TypeScript |
| Packages | npm, `package-lock.json` |
| WebSocket | `ws` (evaluate `noServer` mode with explicit upgrade handling) |
| HTTP | `node:http` |
| Crypto / validation / logging / tests | `node:crypto` / Zod / Pino / Vitest |
| Packaging | Docker, Docker Compose |
| State | In-memory, single instance by default |
| Architecture style | Modular monolith (proposed ADR-0005) |
| Protocol | Own versioned protocol (ADR-0018) |
| Client | First-party TypeScript SDK (ADR-0019) |
| Client auth | Backend-issued short-lived scoped tokens (ADR-0020) |
| Publishing | Own versioned HTTP API (ADR-0009) |
| Channels / events | Own conventions (ADR-0021) |

## 3. System context

```text
 Browser / mobile app               Consuming project backend
 (first-party client SDK)           (owns users, permissions, business data)
        |                                   |            |
        | 1. request token (existing auth)  |            |
        |---------------------------------->|            | 3. HTTPS publish request
        |<----------------------------------|            |    (authenticated)
        |    short-lived scoped token       |            v
        | 2. WebSocket (wss) + token        |     +--------------------+
        v                                   |     |  Publishing API    |
 +----------------------------------------------------------------------+
 |                Realtime server (one per project deployment)          |
 |  Transport -> Protocol -> Connections -> Channels -> Dispatcher      |
 |           Authentication/Authorization · Presence (if in scope)      |
 +----------------------------------------------------------------------+
```

The server never calls the backend for business data and never owns or mutates
business records. The backend issues short-lived tokens; the server validates
them independently. Long-lived server credentials never reach clients.

## 4. Modules and responsibilities

Responsibilities stay separated: a module must not take on another's concern.

| Module | Owns | Must not |
|---|---|---|
| Transport | HTTP server, upgrade handling, socket lifecycle, ping/pong, frame limits, backpressure, graceful shutdown | Contain protocol or channel logic |
| Protocol | Parse/validate/serialize protocol messages, protocol errors, version handling | Touch sockets directly or hold channel state |
| Connection manager | Connection IDs, registry, connection state, cleanup on close | Decide channel access |
| Channel / subscription manager | Channel registry, membership, channel-type rules, isolation | Verify tokens or signatures |
| Event dispatcher | Select local subscribers, deliver, bounded queues | Log payloads |
| Authentication / authorization | Connection-token validation, private-channel authorization, publisher authentication, origin policy | Make business permission decisions |
| Presence manager | Membership, join/leave notifications, multi-connection users | Exist unless a presence requirement is established |
| Publishing API | Authenticated HTTP ingestion, replay protection, validation, limits, error model | Own business state |
| Operational endpoints | Health, readiness, restricted stats | Expose secrets or per-connection data |
| Configuration / logging | Zod-validated config, structured Pino logs, metrics | Log secrets or tokens |

The **client SDK** is a separate deliverable in the same repository (ADR-0019).
Its public API is kept separate from its internal protocol implementation, and it
must not import server-internal modules.

Dependency direction: Transport → Protocol → (Connections, Channels,
Authentication/Authorization) → Dispatcher. The Publishing API enters at the
Dispatcher via publisher authentication. Exact interfaces are **[DESIGN]**.

## 5. State model (single instance)

- All state is in process memory: connections, channels, subscriptions,
  presence members.
- State is lost on restart; clients reconnect, obtain fresh tokens, and
  resubscribe.
- State is keyed within one deployment; nothing is shared between deployments.

## 6. Delivery semantics

Events are real-time notifications, not durable messages. There is no replay,
no exactly-once, and no guaranteed delivery. Clients that need correctness must
reconcile with the consuming backend after reconnect.

## 7. Optional horizontal scaling boundary

Single instance is the default. Multi-instance support (load balancer, Redis
Pub/Sub, distributed presence) is a deferred Phase 10 capability, introduced only
for a verified requirement and approved cost. Redis Pub/Sub is not durable, and
presence across instances needs shared membership coordination beyond Pub/Sub.
The module boundaries above (notably the dispatcher) should keep an adapter seam
open without implementing it.

## 8. Cross-cutting requirements

Security: see [SECURITY.md](SECURITY.md). Observability: structured logs and
metrics per specification section 12. Testing: unit, protocol compatibility,
integration, security, resilience per specification section 11. No capacity
figure may be claimed without benchmarks.

## 9. Open and design items

- **[DESIGN]** Application protocol: versioning, envelope, message/event types, errors (ADR-0018).
- **[DESIGN]** Connection token format, verification scheme, lifetime, scope, delivery (ADR-0020).
- **[DESIGN]** Private-channel authorization evidence model (ADR-0020).
- **[DESIGN]** Publishing API endpoints, authentication, replay protection, errors (ADR-0009).
- **[DESIGN]** Channel naming and event envelope (ADR-0021).
- **[DESIGN]** SDK public API, packaging, and compatibility policy (ADR-0019).
- **[OPEN]** Which channel types beyond public/private are required (presence, client-originated events).
- **[OPEN]** Workload, payload sizes, availability and recovery expectations.
- **[OPEN]** Whether `ws` `noServer` mode is adopted (ADR-0003).
- **[OPEN]** Module interface contracts and ADR approval (Phase 01).
