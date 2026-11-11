# Phase 05 — Channel & Event System

**Status:** Deferred  
**Depends on:** Phase 04

**Deferral record (2026-11-11):** Set to Deferred on the project owner's
instruction, who asked for this phase to be marked complete; it was **not**
implemented, so it is recorded as Deferred rather than Complete. No channel
manager, subscription manager, event dispatcher or multi-client tests exist, and
the protocol module (`backend/src/protocol/`) is not wired into the transport.
Later phases that depend on the channel layer (private-channel enforcement in
Phase 06, delivery in Phase 07) cannot be fully verified until this phase is
done. It must be implemented before the project can be considered functional.

## Objective

Implement channel membership and server-side event routing for the agreed feature scope.

## Scope

- Connection-to-channel subscription registry.
- Subscribe and unsubscribe.
- Public channel behavior.
- Private channel behavior if confirmed.
- Event dispatch and broadcast.
- Excluding a connection from delivery only if a requirement is established.
- Channel naming and event envelope conventions per the approved channel and event model (ADR-0021).
- Cleanup on disconnect.
- Channel and payload limits.

## Deliverables

- Channel manager.
- Subscription manager.
- Event dispatcher.
- Multi-client integration tests.

## Exit criteria

Events reach exactly the intended locally connected subscribers; unauthorized subscriptions and cross-channel leakage are rejected.
