# Phase 04 — Application Protocol

**Status:** In progress (specification stage only)  
**Depends on:** Phases 00, 01, and 03

**Progress note (2026-11-11):** The specification in
`docs/protocol/protocol-specification.md` was approved on the project owner's
instruction ("Do it"), taking every recommended option; ADR-0018 was accepted on
the same basis (ADR-0021 remains Proposed). The protocol module is implemented
in `backend/src/protocol/` (Zod schemas, parser, serializer, error/close-code
catalog, version negotiation, per-connection session logic) with shared
fixtures in `backend/src/protocol/fixtures/`. Checks run: typecheck, lint,
format check, build and `vitest run` (5 files, 84 tests) passed.
**Not done:** the module is not wired into the transport/`main.ts`, so no
end-to-end protocol flow runs over a real socket yet (this needs the channel
layer from Phase 05 to answer `subscribe`). Awaiting owner review before the
status is changed to Complete.
## Objective

Specify and implement the project's own versioned WebSocket application protocol on top of the standard WebSocket transport. No third-party protocol compatibility is in scope (ADR-0004, ADR-0018).

All message names, envelope fields, error codes, and timings are **design items** that must be written up and approved before implementation. They must not be invented in code.

## Scope

- Protocol versioning and version negotiation/rejection policy.
- Message envelope design.
- Connection establishment (including the connection-established and connection-error behavior).
- Heartbeat and ping/pong behavior.
- Subscription and unsubscription messages and their success/failure responses.
- Event publishing and delivery messages.
- Error model and error handling.
- Reconnection behavior (what the server guarantees and what clients must do).
- Zod schemas for every inbound message at the trust boundary.
- Protocol compatibility tests.

## Deliverables

- Protocol specification document (versions, envelopes, event types, errors, subscription lifecycle) reviewed and approved.
- Protocol parser/serializer.
- Protocol message and error catalog.
- Protocol compatibility test suite and fixtures reusable by the client SDK (Phase 08).

## Exit criteria

The protocol specification is approved, and required protocol flows (connect, heartbeat, subscribe, unsubscribe, deliver, error, version mismatch, malformed input) pass automated tests. Protocol compatibility policy between server and SDK versions is documented.
