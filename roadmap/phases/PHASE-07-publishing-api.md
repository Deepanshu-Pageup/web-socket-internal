# Phase 07 — Server-side Publishing API

**Status:** Not started  
**Depends on:** Phases 04 and 05

## Objective

Provide the project's own versioned server-to-server HTTP publishing API for consuming backends.

Endpoint paths, the authentication scheme (deployment-specific server credentials or cryptographic request signatures), replay-protection mechanism, and error model are **design items** (ADR-0009) that must be approved before implementation.

## Scope

- API versioning.
- Backend request authentication (credentials or signatures) and replay protection.
- Request/body validation (channel names, event names, payload) with Zod.
- Single-channel publishing; multi-channel only if a requirement is established.
- Payload and rate limits.
- Consistent versioned HTTP error responses.
- Integration tests from a reference backend client.

## Deliverables

- Approved publishing API design.
- Publishing routes and service.
- API contract documentation.
- Integration and negative tests (bad credentials, replay, tampered body, oversize, invalid input).

## Exit criteria

Supported publishing calls produce correct delivery to authorized subscribers; invalid, replayed, or oversized requests are rejected with the documented errors.
