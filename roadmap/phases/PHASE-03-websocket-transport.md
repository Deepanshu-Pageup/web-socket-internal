# Phase 03 — WebSocket Transport

**Status:** In progress  
**Depends on:** Phase 02

**Progress note (2026-11-11):** Started on the project owner's approval of the
Phase 03 plan. Transport module implemented in `src/transport/` with an
`UpgradeAuthenticator` hook (interface only; no token logic) and wired into
`src/main.ts`. Awaiting owner review before the status is changed to Complete.

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
