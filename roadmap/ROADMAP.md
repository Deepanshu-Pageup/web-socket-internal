# Project Roadmap

## Target outcome

A reusable, self-hosted, independent real-time system — server, versioned application protocol, first-party TypeScript client SDK, and versioned HTTP publishing API — that company projects can run independently using a versioned Docker image.

## Architecture baseline

- Deployment: independent per project.
- Distribution: Docker image.
- Scaling: optional; single-node is the default.
- Runtime: Node.js 24 LTS.
- Language: TypeScript (strict mode).
- Package manager: npm.
- WebSocket transport: `ws` library (standard WebSocket).
- Application protocol: own versioned protocol (ADR-0018). Details are design items requiring approval.
- Client: first-party TypeScript SDK (ADR-0019).
- Client authentication: backend-issued short-lived scoped connection tokens (ADR-0020). Format and algorithms are design items requiring approval.
- Publishing: own versioned HTTP API (ADR-0009). Endpoints and signing are design items requiring approval.
- Channels and events: own naming and event conventions (ADR-0021).
- Initial state: in-memory.
- Initial infrastructure: no mandatory Redis or PostgreSQL.
- Multi-node messaging: Redis adapter only when justified by a project requirement.

The project does not implement third-party realtime protocol compatibility (ADR-0004).

## Phases and gates

### Phase 00 — Requirements Discovery
Establish real requirements: consuming projects, channel types, event and payload conventions, authentication flows, workload, and operational expectations. Inventory existing legacy realtime integrations that must be migrated.

**Gate:** Consuming-project usage, channel types, auth flows, event payloads, workload, migration inventory, and operational expectations are documented.

### Phase 01 — Architecture & ADR Approval
Finalize module boundaries, protocol design scope, token and authorization model, publishing API design, SDK architecture, Docker deployment, and ADRs.

**Gate:** Architecture and ADRs reviewed and approved. No implementation starts before this gate.

### Phase 02 — Project Foundation
Establish npm-based Node.js/TypeScript project, quality tooling, configuration, logging, tests, and Docker build foundation.

**Gate:** Reproducible install/build/test and minimal container startup.

### Phase 03 — WebSocket Transport
Implement the transport boundary using `ws`, explicit HTTP upgrade handling, lifecycle management, heartbeat behavior, limits, and graceful shutdown.

**Gate:** Transport tests pass for valid/invalid handshakes, frames, disconnects, and resource cleanup.

### Phase 04 — Application Protocol
Specify and implement the versioned application protocol: protocol versioning, message envelope design, connection establishment, heartbeat and ping/pong, subscription and unsubscription, event publishing and delivery, error handling, reconnection behavior, and protocol compatibility tests.

**Gate:** Protocol specification approved; protocol compatibility tests pass.

### Phase 05 — Channel & Event System
Implement channel registry, subscriptions, unsubscriptions, public/private channel behavior, event dispatch, broadcasting, and cleanup.

**Gate:** Multi-client channel tests pass, including isolation and unauthorized subscription cases.

### Phase 06 — Authentication & Presence
Implement connection-token validation, private-channel authorization, publisher authentication, and presence membership only if a requirement is established.

**Gate:** Token, authorization, and authentication tests pass; presence behavior is verified if in scope.

### Phase 07 — Server-side Publishing API
Implement the versioned HTTP publishing API: authentication, replay protection, validation, payload limits, and error responses.

**Gate:** Publishing integration and negative tests (bad credentials, replay, oversize, invalid input) pass.

### Phase 08 — Client SDK, Integration, Reliability & Performance
Implement the first-party TypeScript client SDK (connection lifecycle, reconnection, heartbeat, subscriptions, event handling; public API separate from internal protocol). Integrate at least one real company project. Test reconnect behavior, backpressure, payload limits, load, graceful shutdown, and failure handling.

**Gate:** SDK tests pass against the server; agreed workload targets and reliability/security acceptance criteria are met.

### Phase 09 — Docker Distribution & Deployment
Finalize Docker image, configuration contract, health/readiness behavior, versioning, release process, and project-level deployment guide.

**Gate:** A company project can deploy and upgrade a pinned image independently using documented steps.

### Phase 10 — Optional Horizontal Scaling
Only when a project requires multiple WebSocket instances: add load balancing, Redis-based inter-node messaging, distributed presence coordination if needed, and failure/recovery tests.

**Gate:** Cross-instance delivery and membership behavior are verified; Redis operational cost and hosting are approved before any paid service is used.

## Cross-phase quality requirements

- Security: no long-lived secrets in browser code; no secrets or tokens in logs; validate origin, tokens, payloads, and authorization.
- Isolation: one deployment's state and events cannot leak into another deployment.
- Reliability: clients reconnect and resubscribe; transient WebSocket delivery is not assumed durable.
- Maintainability: protocol, transport, channel logic, publishing, SDK, and infrastructure remain separated.
- Design discipline: protocol messages, token formats, cryptographic algorithms, and endpoint contracts are specified and approved before implementation.
- Testing: unit, protocol, integration, security, concurrency, and load tests as appropriate.
- Cost: use local/free tooling initially; obtain approval before paid infrastructure or services.

## Status definitions

- Not started
- In progress
- Blocked
- In review
- Complete
- Deferred
