# System Architecture

**Status:** Draft — not reviewed or approved (Phase 01 not started)
**Source of truth:** `roadmap/Internal-Realtime-Server-Product-Specification.md`
**Related:** [Connection lifecycle](CONNECTION-LIFECYCLE.md) ·
[Channel and event flow](CHANNEL-AND-EVENT-FLOW.md) ·
[Authorization flow](AUTHORIZATION-FLOW.md) · [Publishing API](PUBLISHING-API.md) ·
[Deployment architecture](DEPLOYMENT-ARCHITECTURE.md) · [Security](SECURITY.md)

> This document prepares Phase 01. It is not an approved design. Items marked
> **[OPEN]** depend on Phase 00 evidence and must not be treated as decided.
> Nothing here authorizes implementation.

## 1. Purpose and scope

A reusable, self-hosted, Pusher Channels-compatible realtime server. One shared
source repository produces a versioned Docker image; each consuming project
deploys its own independent instance. The server is a generic infrastructure
component and contains no project-specific business logic.

### Non-goals

Public SaaS, multi-tenant service, workspace/billing/identity management,
durable queue or event store, Socket.IO, full Pusher feature parity, and (in the
first release) Redis, PostgreSQL, Kubernetes, or a management dashboard.

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

## 3. System context

```text
 Browser / mobile client            Consuming project backend
 (Pusher client SDK)                (owns users, permissions, business data)
        |                                   |            |
        | WebSocket (wss)                   |            | HTTPS, signed request
        |                                   |            v
        |             channel auth  <-------+     +--------------------+
        |             (signed response)           |  Publishing API    |
        v                                         +----------+---------+
 +----------------------------------------------------------------------+
 |                Realtime server (one per project deployment)          |
 |  Transport -> Protocol -> Connections -> Channels -> Dispatcher      |
 |                  Authorization · Presence (if in scope)              |
 +----------------------------------------------------------------------+
```

The server never calls the backend for business data and never owns or mutates
business records. Clients obtain channel authorization from the backend, which
signs it with the shared application secret; the server verifies independently.

## 4. Modules and responsibilities

Responsibilities stay separated: a module must not take on another's concern.

| Module | Owns | Must not |
|---|---|---|
| Transport | HTTP server, upgrade handling, socket lifecycle, ping/pong, frame limits, backpressure, graceful shutdown | Contain Pusher or channel logic |
| Protocol | Parse/validate/serialize Pusher messages, protocol errors, version handling | Touch sockets directly or hold channel state |
| Connection manager | Socket IDs, registry, connection state, cleanup on close | Decide channel access |
| Channel / subscription manager | Channel registry, membership, channel-type rules, isolation | Verify signatures |
| Event dispatcher | Select local subscribers, deliver, bounded queues, excluded socket (if required) | Log payloads |
| Authorization | Publisher signature/timestamp checks, channel auth signatures, origin policy | Make business permission decisions |
| Presence manager | Membership, add/remove notifications, multi-connection users | Exist unless discovery confirms presence |
| Publishing API | Signed HTTP ingestion, validation, limits, compatible responses | Own business state |
| Operational endpoints | Health, readiness, restricted stats | Expose secrets or per-connection data |
| Configuration / logging | Zod-validated config, structured Pino logs, metrics | Log secrets or signatures |

Dependency direction: Transport → Protocol → (Connections, Channels,
Authorization) → Dispatcher. The Publishing API enters at the Dispatcher via
Authorization. Exact interfaces are to be defined in Phase 01 ADRs.

## 5. State model (single instance)

- All state is in process memory: connections, channels, subscriptions,
  presence members.
- State is lost on restart; clients reconnect, re-authorize where needed, and
  resubscribe.
- State is keyed within one deployment/application context; nothing is shared
  between deployments.

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
metrics per specification section 12 (connections, channels, subscriptions,
published/delivered events, rejected requests, auth failures, queue pressure).
Testing: unit, protocol, integration, security, resilience per specification
section 11. No capacity figure may be claimed without benchmarks.

## 9. Open items

- **[OPEN]** Protocol subset and SDK versions (Phase 00: `PUSHER-COMPATIBILITY.md`).
- **[OPEN]** Channel types actually used (public, private, presence, encrypted/cache).
- **[OPEN]** Client events, webhooks, subscription-count usage.
- **[OPEN]** Workload, payload sizes, availability and recovery expectations.
- **[OPEN]** Whether `ws` `noServer` mode is adopted (ADR-0003).
- **[OPEN]** Module interface contracts and ADR approval (Phase 01).
