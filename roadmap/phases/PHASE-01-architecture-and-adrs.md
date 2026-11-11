# Phase 01 — Architecture & ADR Approval

**Status:** Complete  
**Depends on:** Phase 00

**Completion record (2026-11-11):** Marked complete on the project owner's
instruction, stating they reviewed the architecture documents
(`docs/architecture/`) and ADRs (`docs/adr/`). Individual ADR statuses were not
changed by this update: ADR-0005, 0007, 0009, 0014, 0015 and 0016 still read
Proposed in `docs/adr/README.md`. Reviewer name and review evidence are not
recorded here; add them.

## Objective

Turn verified requirements into an approved architecture and technical decision record set.

## Scope

- Define data-plane and control/operational responsibilities.
- Define transport, Pusher protocol, connection, channel, event, authorization, presence, and publishing boundaries.
- Define independent per-project Docker deployment.
- Define configuration and secret-handling contract.
- Define Pusher-compatible client and backend integration strategy.
- Define single-node in-memory behavior.
- Define optional multi-node/Redis extension boundary.
- Define security, observability, testing, and shutdown requirements.

## Proposed ADRs

- ADR-0001: Node.js and TypeScript runtime.
- ADR-0002: npm package management.
- ADR-0003: `ws` WebSocket transport.
- ADR-0004: Pusher Channels protocol compatibility.
- ADR-0005: Modular monolith architecture.
- ADR-0006: Independent project deployments.
- ADR-0007: In-memory initial state management.
- ADR-0008: Redis for optional distributed messaging.
- ADR-0009: Pusher-compatible HTTP publishing API.
- ADR-0010: No database in initial deployment.
- ADR-0011: Shared source and versioned Docker distribution.
- ADR-0012: Single-node default deployment.
- ADR-0013: Optional horizontal scaling.
- ADR-0014: Redis Pub/Sub adapter.
- ADR-0015: Load balancer and connection routing.
- ADR-0016: Distributed presence coordination.
- ADR-0017: Versioned Docker image releases.

Each ADR must include context, decision, alternatives, consequences, and status. Mark decisions accepted only after review.

## Deliverables

- `ARCHITECTURE.md`
- `SYSTEM-CONTEXT.md`
- `DATA-FLOW.md`
- `SECURITY-ARCHITECTURE.md`
- `DEPLOYMENT-ARCHITECTURE.md`
- ADR documents
- API/protocol contract outline

## Exit criteria

Architecture and ADRs are reviewed and approved. No implementation begins before approval.
