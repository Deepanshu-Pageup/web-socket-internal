# Phase 03 — WebSocket Transport

**Status:** Complete  
**Depends on:** Phase 02

**Completion record (2026-11-11):** Marked complete on the project owner's
acceptance. Transport module implemented in `backend/src/transport/` with an
`UpgradeAuthenticator` hook (interface only; no token logic) and wired into
`backend/src/main.ts`. Checks run by the assistant before acceptance: typecheck,
lint, format check, build, and `vitest run` (4 files, 33 tests) passed. Not
verified: manual run of the built server, shutdown signal handling on a real
process, and the Docker build. Known limitation: until an authentication design
is approved (ADR-0020), any upgrade passing path/origin/capacity checks is
accepted.

## Objective

Implement a tested WebSocket transport boundary using the selected `ws` library.

## Scope

- HTTP server and explicit upgrade handling.
- WebSocket path and request validation.
- Connection lifecycle.
- Ping/pong and dead-connection detection.
- Frame/message size limits.
- Backpressure and slow-client handling.
- Graceful shutdown and connection cleanup.
- Transport-level observability.

## Deliverables

- Transport module.
- Connection lifecycle contracts.
- Unit and integration tests.

## Exit criteria

Transport behavior is correct under valid/invalid requests, disconnects, slow clients, and shutdown. No protocol or channel logic belongs in this layer.
