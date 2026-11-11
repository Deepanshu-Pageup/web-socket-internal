# ADR-0010: No Database in Initial Deployment

- **Status:** Accepted direction
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

The initial real-time runtime can operate without persisting connection and subscription state.

## Decision

Do not introduce a database in the first release unless a confirmed requirement needs durable configuration or records.

## Alternatives considered

- **Alternative 1:** Defer the capability or use a different approach.
- **Alternative 2:** Adopt a more complex or more tightly coupled implementation.

The alternatives must be revisited if discovery reveals requirements that materially change this decision.

## Consequences

Reduces operational complexity; persistent management features remain out of scope initially.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- For Pusher compatibility decisions, validate behavior against the company's actual client and server SDK versions.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
