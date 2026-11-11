# Phase 06 — Authentication & Presence

**Status:** Not started  
**Depends on:** Phase 05 and Phase 00 requirements

## Objective

Implement application and channel authorization, plus presence only where required.

## Scope

- Application/publisher credential validation.
- Pusher-compatible private-channel signatures.
- Presence authorization and user-data signature validation if required.
- Origin policy.
- Secret handling and redaction.
- Authorization failure behavior.
- Presence membership and duplicate connections if required.
- Cleanup and race-condition handling.

## Deliverables

- Authorization components.
- Security tests.
- Presence behavior specification and tests if in scope.

## Exit criteria

Invalid signatures and unauthorized subscriptions are rejected; secrets are never exposed to clients or logs.
