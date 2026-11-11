# Phase 03 — WebSocket Transport

**Status:** Not started  
**Depends on:** Phase 02

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

Transport behavior is correct under valid/invalid requests, disconnects, slow clients, and shutdown. No Pusher channel logic belongs in this layer.
