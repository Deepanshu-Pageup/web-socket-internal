# Phase 06 — Authentication & Presence

**Status:** In progress (partial scope)  
**Depends on:** Phase 05 and Phase 00 requirements

**Progress note (2026-11-11):** Started on the project owner's approval of the
Phase 06 plan, although Phase 05 is Deferred. In scope now: connection-token
verification, the channel-scope check, origin policy (unchanged), and log
redaction, per `docs/auth/token-and-authorization-specification.md`. Out of
scope for now: publisher authentication (moves to the Phase 07 design) and
presence (no requirement). Private-channel enforcement cannot be applied or
tested end to end until the channel layer exists, so this phase cannot be marked
Complete before Phase 05 is done.

## Objective

Implement connection-token validation, private-channel authorization, and publisher authentication using the project's own contracts, plus presence only where required.

The token format, verification scheme, algorithms, lifetimes, scope model, and delivery mechanism are **design items** (ADR-0020). They must be specified and approved before implementation.

## Scope

- Backend-issued short-lived, scoped connection token validation.
- Private-channel authorization (token-embedded scope or per-channel grants, as approved).
- Deployment-specific publisher credential validation (shared with Phase 07 contract).
- Presence claims validation and membership if a requirement is established.
- Origin policy.
- Secret and token handling and redaction.
- Credential rotation approach.
- Authorization failure behavior.
- Presence membership and duplicate connections if required.
- Cleanup and race-condition handling.

## Deliverables

- Approved token and authorization design.
- Authentication/authorization components.
- Security tests.
- Presence behavior specification and tests if in scope.

## Exit criteria

Invalid, expired, and tampered tokens and unauthorized subscriptions are rejected; long-lived secrets are never exposed to clients; secrets and tokens are never logged.
