# ADR-0004: Pusher Channels Protocol Compatibility

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

Existing applications should be able to reuse Pusher Channels client integrations where feasible.

## Decision

Target compatibility with the Pusher Channels protocol, prioritizing the SDKs and features confirmed in company usage.

## Alternatives considered

- **Alternative 1:** Defer the capability or use a different approach.
- **Alternative 2:** Adopt a more complex or more tightly coupled implementation.

The alternatives must be revisited if discovery reveals requirements that materially change this decision.

## Consequences

Compatibility must be tested against real SDK versions. This does not imply full feature parity with the hosted Pusher platform.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- For Pusher compatibility decisions, validate behavior against the company's actual client and server SDK versions.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
