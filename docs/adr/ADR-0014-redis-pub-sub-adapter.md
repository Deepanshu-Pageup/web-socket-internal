# ADR-0014: Redis Pub/Sub Adapter

- **Status:** Proposed
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

Multiple instances need a way to distribute published events to connections held by other instances.

## Decision

If horizontal scaling is approved, implement Redis Pub/Sub behind a transport-independent messaging adapter.

## Alternatives considered

- **Alternative 1:** Defer the capability or use a different approach.
- **Alternative 2:** Adopt a more complex or more tightly coupled implementation.

The alternatives must be revisited if discovery reveals requirements that materially change this decision.

## Consequences

Supports cross-node fan-out; Pub/Sub is best-effort and requires reconnect/reconciliation behavior.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- For Pusher compatibility decisions, validate behavior against the company's actual client and server SDK versions.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
