# Phase 06 — Authentication & Presence

**Status:** Not started  
**Depends on:** Phase 05 and Phase 00 requirements

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
