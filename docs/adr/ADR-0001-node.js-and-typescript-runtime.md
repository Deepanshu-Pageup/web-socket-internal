# ADR-0001: Node.js and TypeScript Runtime

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

The server needs a maintainable runtime with strong networking support and type safety.

## Decision

Use Node.js 24 LTS with strict TypeScript.

## Alternatives considered

- **Alternative 1:** Defer the capability or use a different approach.
- **Alternative 2:** Adopt a more complex or more tightly coupled implementation.

The alternatives must be revisited if discovery reveals requirements that materially change this decision.

## Consequences

Keeps the runtime aligned with the existing Node ecosystem; requires disciplined TypeScript configuration.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- Protocol, authentication, and publishing contracts are project-owned design items; do not treat them as decided until their ADRs are approved.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
