# Phase 01 — Architecture & ADR Approval

**Status:** Complete  
**Depends on:** Phase 00

**Completion record (2026-11-11):** Marked complete on the project owner's
instruction, stating they reviewed the architecture documents
(`docs/architecture/`) and ADRs (`docs/adr/`). Reviewer name and review
evidence are not recorded here; add them.

**Revision note (2026-11-11):** The architecture was revised to an independent
protocol, SDK, authentication model, and publishing API (ADR-0004). The ADR set
and architecture documents were rewritten. New ADRs 0018–0021 and the rewritten
ADR-0009 are **Proposed**, as are ADR-0005, 0007, 0014, 0015, and 0016. The
completion record above predates this revision and did not review the new
decisions. The project owner must decide whether Phase 01 must be re-reviewed
before Phase 02 or later phases proceed.

## Objective

Turn verified requirements into an approved architecture and technical decision record set.

## Scope

- Define data-plane and control/operational responsibilities.
- Define transport, protocol, connection, channel, event, authorization, presence, publishing, and client SDK boundaries.
- Define independent per-project Docker deployment.
- Define configuration and secret-handling contract.
- Define the connection-token and private-channel authorization model.
- Define the publishing API design (authentication, replay protection, limits, errors).
- Define the client SDK architecture and the protocol/SDK versioning policy.
- Define single-node in-memory behavior.
- Define optional multi-node/Redis extension boundary.
- Define security, observability, testing, and shutdown requirements.

## ADR set

- ADR-0001: Node.js and TypeScript runtime.
- ADR-0002: npm package management.
- ADR-0003: `ws` WebSocket transport.
- ADR-0004: Rejected third-party dependency and independent protocol decision (historical).
- ADR-0005: Modular monolith architecture.
- ADR-0006: Independent project deployments.
- ADR-0007: In-memory initial state management.
- ADR-0008: Redis for optional distributed messaging.
- ADR-0009: Custom versioned HTTP publishing API.
- ADR-0010: No database in initial deployment.
- ADR-0011: Shared source and versioned Docker distribution.
- ADR-0012: Single-node default deployment.
- ADR-0013: Optional horizontal scaling.
- ADR-0014: Redis Pub/Sub adapter.
- ADR-0015: Load balancer and connection routing.
- ADR-0016: Distributed presence coordination.
- ADR-0017: Versioned Docker image releases.
- ADR-0018: Independent versioned application protocol.
- ADR-0019: First-party TypeScript client SDK.
- ADR-0020: Backend-issued short-lived connection tokens and channel authorization.
- ADR-0021: Independent channel and event model.

Each ADR must include context, decision, alternatives, consequences, and status. Mark decisions accepted only after review.

## Deliverables

- Architecture documents in `docs/architecture/`.
- ADR documents and index in `docs/adr/`.
- Protocol, token, and publishing API contract outlines (design items, approved before Phase 04/06/07 implementation).

## Exit criteria

Architecture and ADRs are reviewed and approved. No implementation begins before approval.
