# ADR-0003: WebSocket Transport Using ws

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

The server needs a standards-compliant WebSocket transport without implementing framing itself.

## Decision

Use the ws library with explicit HTTP upgrade handling.

## Alternatives considered

- **Alternative 1:** Defer the capability or use a different approach.
- **Alternative 2:** Adopt a more complex or more tightly coupled implementation.

The alternatives must be revisited if discovery reveals requirements that materially change this decision.

## Consequences

ws handles transport framing and lifecycle primitives; the application-level protocol (ADR-0018), authentication, and channel behavior remain our responsibility. The transport is standard WebSocket; no third-party application protocol is implied.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- Protocol, authentication, and publishing contracts are project-owned design items; do not treat them as decided until their ADRs are approved.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
