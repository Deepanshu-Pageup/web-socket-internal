# ADR-0021: Independent Channel and Event Model

- **Status:** Proposed
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

The project owns its channel and event conventions (ADR-0004). Public and
private channels are confirmed requirements. Presence channels are optional
until a real requirement is established.

## Decision

Define project-owned conventions for:

- Channel naming, including how public and private channels are distinguished.
- The event envelope delivered to clients.
- Subscription semantics (idempotent subscribe; unsubscribing a channel that is
  not subscribed is not an error).
- Channel and event name validation and limits.

Support **public** and **private** channels in Release 1. Keep **presence**
optional and out of scope until a requirement is established and approved.
Business permissions and business logic remain in consuming backends.

**Design items requiring approval (not decided here):** naming scheme and
allowed characters; event envelope fields; name and payload size limits;
whether a connection may be excluded from a delivery; whether client-originated
events are needed.

## Alternatives considered

- **Adopt another system's naming and event conventions:** rejected
  (ADR-0004); would import assumptions we have not chosen.
- **Unstructured channel names:** simpler; harder to validate and to enforce
  channel-type rules.

## Consequences

- We document naming and envelope conventions and test them.
- Channel type must be derivable and enforced server-side; clients cannot
  assert it.
- Delivery remains best-effort and non-durable.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- Protocol, authentication, and publishing contracts are project-owned design items; do not treat them as decided until their ADRs are approved.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
