# Phase 05 — Channel & Event System

**Status:** Not started  
**Depends on:** Phase 04

## Objective

Implement channel membership and server-side event routing for the agreed feature scope.

## Scope

- Connection-to-channel subscription registry.
- Subscribe and unsubscribe.
- Public channel behavior.
- Private channel behavior if confirmed.
- Event dispatch and broadcast.
- Exclude-originating-socket behavior if required.
- Cleanup on disconnect.
- Channel and payload limits.

## Deliverables

- Channel manager.
- Subscription manager.
- Event dispatcher.
- Multi-client integration tests.

## Exit criteria

Events reach exactly the intended locally connected subscribers; unauthorized subscriptions and cross-channel leakage are rejected.
