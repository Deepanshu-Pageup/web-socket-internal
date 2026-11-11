# ADR-0019: First-Party TypeScript Client SDK

- **Status:** Proposed
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

With a project-owned protocol (ADR-0018), no existing client library applies.
Consuming frontends need a supported way to connect, authenticate, subscribe,
and receive events without each reimplementing reconnection and heartbeat logic.

## Decision

Develop and maintain a first-party TypeScript client SDK in this repository.

The SDK will manage:

- Connection lifecycle.
- Reconnection (with backoff) and fresh token acquisition through a
  consumer-supplied token provider.
- Heartbeat.
- Subscriptions, including resubscription after reconnect.
- Event handling.

The SDK's **public API** is kept separate from its **internal protocol
implementation**, so the wire protocol can evolve without breaking SDK
consumers within the documented compatibility policy. The SDK never holds a
long-lived server secret.

**Design items requiring approval (not decided here):** public API shape;
packaging and distribution (any registry cost needs explicit approval);
supported runtimes/browsers; SDK/server version compatibility policy.

## Alternatives considered

- **Document the protocol and let each project write a client:** duplicated
  effort and inconsistent reconnect behavior.
- **Wrap a general-purpose WebSocket client library:** possible internally, but
  the public SDK contract remains ours.

## Consequences

- We maintain the SDK, its documentation, and its tests (including protocol
  compatibility tests against the server).
- SDK delivery is scheduled in Phase 08 and depends on the approved protocol
  specification.
- Browser-targeted code must not receive long-lived secrets.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- Protocol, authentication, and publishing contracts are project-owned design items; do not treat them as decided until their ADRs are approved.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
