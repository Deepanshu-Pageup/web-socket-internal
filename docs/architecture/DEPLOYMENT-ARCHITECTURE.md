# Deployment Architecture

**Status:** Draft — revised for the independent architecture (ADR-0004); not re-reviewed or approved
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) · [Security](SECURITY.md)

> No infrastructure is provisioned by this document. No paid hosting, Redis,
> database, domain, or monitoring may be added without explicit approval. Values
> in angle brackets and example names are placeholders.

## 1. Model

One shared source repository and release pipeline produce a **versioned Docker
image**. Each consuming project runs its own independent container(s) alongside
its backend and frontend, with its own configuration and secret.

```text
 Source repo -> build/test -> versioned image (e.g. <registry>/internal-realtime-server:<version>)
                                   |                    |
                                   v                    v
                          Project A deployment   Project B deployment
                          backend + frontend     backend + frontend
                          realtime server A      realtime server B
```

Deployments share no connections, channels, presence, credentials, or runtime
state. Each project chooses its version and upgrades or rolls back on its own.

## 2. Single-instance default

- One process, in-memory state, no Redis, no database.
- Restart clears state; clients reconnect and resubscribe.
- Availability across restarts is limited to client reconnection; there is no
  failover in this profile. Whether that meets each project's expectations is
  **[OPEN]** (Phase 00).

## 3. Image and release rules

- Built with npm using `package-lock.json` (`npm ci`); Node.js 24 LTS base.
- Semantic, immutable version tags. Projects pin an exact version.
- Never use an unpinned `latest` tag for controlled production deployment.
- Run as a non-root user; minimal image; no secrets baked into the image.
- Registry, signing, and release process **[OPEN]** (Phase 09; hosting costs need
  approval).

## 4. Configuration contract (to be finalized)

Configuration is supplied by environment (validated at startup with Zod; fail
fast with a clear, non-secret error on invalid values). Names below are
illustrative placeholders, not final:

| Group | Examples |
|---|---|
| Deployment credentials | deployment identifier; client-token verification credential(s); publisher credential(s) **[DESIGN: ADR-0020, ADR-0009]** |
| Network | host, port, WebSocket path |
| Origins | allowed origins |
| Limits | max message size, max subscriptions, outbound buffer, rate limits |
| Heartbeat | intervals and timeouts |
| Operations | log level, stats/health access control |

Secrets come from the deployment's secret mechanism (for example an
env file excluded from version control or an orchestrator secret), never from
committed files or examples containing real values.

## 5. Network and TLS

- Production clients connect over `wss`; publishing API over HTTPS.
- TLS terminates at a reverse proxy/load balancer or the platform edge
  **[OPEN: who terminates TLS per project]**.
- The proxy must support WebSocket upgrade and long-lived connections, with idle
  timeouts longer than the heartbeat interval.
- Operational endpoints are reachable only from an internal network or behind
  access control; they are not exposed on the public WebSocket endpoint.

## 6. Health and readiness

| Endpoint | Meaning |
|---|---|
| `GET /health` | Process is alive |
| `GET /ready` | Accepting connections; reports not ready during startup and shutdown |
| `GET /internal/stats` | Aggregate counters only; restricted; no secrets or per-connection data |

Exact response shapes **[OPEN]**.

## 7. Shutdown, upgrade, rollback

- Handle SIGTERM: mark not ready, stop accepting upgrades, close connections
  gracefully, exit within the orchestrator's grace period (see
  [CONNECTION-LIFECYCLE.md](CONNECTION-LIFECYCLE.md)).
- Upgrade: deploy the new pinned version; clients reconnect automatically.
  Expect a brief disconnect window; no state migrates.
- Rollback: redeploy the previous pinned version. There is no persisted data to
  reconcile.

## 8. Local development

Docker Compose for local runs and tests. Local/free tooling only.

## 9. Optional scaled profile (deferred, Phase 10)

Multiple instances behind a WebSocket-capable load balancer with a Redis-based
inter-instance adapter and shared presence coordination. Not part of Release 1.
Requires a verified requirement, a hosting and cost decision, and approval before
any paid service is used. Redis Pub/Sub is non-durable.

## 10. Open items

- **[OPEN]** Each project's hosting environment, TLS termination, and network limits.
- **[OPEN]** Availability and downtime expectations.
- **[OPEN]** Image registry, tagging, and release automation.
- **[OPEN]** Final configuration variable names and defaults.
- **[OPEN]** Resource sizing (requires benchmarks; no capacity claims until measured).
