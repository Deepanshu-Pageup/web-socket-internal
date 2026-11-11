# Project Roadmap

## Target outcome

A reusable, self-hosted, Pusher-compatible real-time server that company projects can run independently using a versioned Docker image.

## Architecture baseline

- Deployment: independent per project.
- Distribution: Docker image.
- Scaling: optional; single-node is the default.
- Runtime: Node.js 24 LTS.
- Language: TypeScript.
- Package manager: npm.
- WebSocket transport: `ws` library.
- Client compatibility: existing Pusher Channels clients, subject to discovery and compatibility tests.
- Initial state: in-memory.
- Initial infrastructure: no mandatory Redis or PostgreSQL.
- Multi-node messaging: Redis adapter only when justified by a project requirement.

## Phases and gates

### Phase 00 — Requirements Discovery
Inspect real company Pusher integrations before finalizing protocol scope.

**Gate:** Existing frontend/backend usage, SDK versions, channel types, auth flows, event payloads, and operational expectations are documented.

### Phase 01 — Architecture & ADR Approval
Finalize module boundaries, protocol scope, security, publishing API, Docker deployment, and ADRs.

**Gate:** Architecture and ADRs reviewed and approved. No implementation starts before this gate.

### Phase 02 — Project Foundation
Establish npm-based Node.js/TypeScript project, quality tooling, configuration, logging, tests, and Docker build foundation.

**Gate:** Reproducible install/build/test and minimal container startup.

### Phase 03 — WebSocket Transport
Implement the transport boundary using `ws`, explicit HTTP upgrade handling, lifecycle management, heartbeat behavior, limits, and graceful shutdown.

**Gate:** Transport tests pass for valid/invalid handshakes, frames, disconnects, and resource cleanup.

### Phase 04 — Pusher Protocol Compatibility
Implement the required Pusher protocol messages, connection events, parsing, serialization, errors, and protocol-version behavior identified in Phase 00.

**Gate:** Protocol conformance tests and initial `pusher-js` connection tests pass.

### Phase 05 — Channel & Event System
Implement channel registry, subscriptions, unsubscriptions, public/private channel behavior as scoped, event dispatch, broadcasting, and cleanup.

**Gate:** Multi-client channel tests pass, including isolation and unauthorized subscription cases.

### Phase 06 — Authentication & Presence
Implement application/publisher authentication, private-channel authorization, and presence membership only to the extent required by discovery.

**Gate:** Signature and authorization tests pass; presence behavior is verified if in scope.

### Phase 07 — Server-side Publishing API
Implement the required Pusher-compatible HTTP publishing endpoints, request signing, validation, limits, and error responses.

**Gate:** Existing backend SDK or migration-adapter integration tests pass for the supported feature set.

### Phase 08 — Integration, Reliability & Performance
Integrate at least one real company project. Test reconnect behavior, backpressure, payload limits, load, graceful shutdown, and failure handling.

**Gate:** Agreed workload targets and reliability/security acceptance criteria are met.

### Phase 09 — Docker Distribution & Deployment
Finalize Docker image, configuration contract, health/readiness behavior, versioning, release process, and project-level deployment guide.

**Gate:** A company project can deploy and upgrade a pinned image independently using documented steps.

### Phase 10 — Optional Horizontal Scaling
Only when a project requires multiple WebSocket instances: add load balancing, Redis-based inter-node messaging, distributed presence coordination if needed, and failure/recovery tests.

**Gate:** Cross-instance delivery and membership behavior are verified; Redis operational cost and hosting are approved before any paid service is used.

## Cross-phase quality requirements

- Security: no secrets in browser code or logs; validate origin, signatures, payloads, and authorization.
- Isolation: one deployment's state and events cannot leak into another deployment.
- Reliability: clients reconnect and resubscribe; transient WebSocket delivery is not assumed durable.
- Maintainability: protocol, transport, channel logic, publishing, and infrastructure remain separated.
- Testing: unit, protocol, integration, security, concurrency, and load tests as appropriate.
- Cost: use local/free tooling initially; obtain approval before paid infrastructure or services.

## Status definitions

- Not started
- In progress
- Blocked
- In review
- Complete
- Deferred
