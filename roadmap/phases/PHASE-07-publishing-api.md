# Phase 07 — Server-side Publishing API

**Status:** Not started  
**Depends on:** Phases 04 and 05

## Objective

Provide a server-to-server publishing API compatible with the required existing backend publishing usage.

## Scope

- Confirm required Pusher HTTP API endpoints and signing conventions.
- Request authentication and timestamp validation.
- Request/body validation.
- Single and multi-channel publishing if required.
- Payload and rate limits.
- Consistent HTTP errors.
- Existing backend SDK or migration-adapter tests.

## Deliverables

- Publishing routes and service.
- API contract documentation.
- Backend compatibility tests.

## Exit criteria

Supported publishing calls from the selected existing SDKs or adapter produce correct delivery to authorized subscribers.
