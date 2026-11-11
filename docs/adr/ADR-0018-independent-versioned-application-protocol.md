# ADR-0018: Independent Versioned Application Protocol

- **Status:** Proposed
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

The project owns the full real-time stack (ADR-0004). Clients and server need a
defined application-level contract on top of standard WebSocket transport
(ADR-0003).

## Decision

Design and implement a project-owned, versioned WebSocket application protocol
covering:

- Protocol versioning and version negotiation/rejection.
- Message envelopes and event types.
- Connection establishment.
- Heartbeat and ping/pong.
- Subscription and unsubscription lifecycle.
- Event delivery.
- Error responses.
- Reconnection behavior.

All inbound messages are validated with Zod at the trust boundary. The protocol
layer is separate from the transport layer (it never touches sockets directly)
and from the channel manager (it holds no channel state).

**Design items requiring approval (not decided here):** versioning scheme;
envelope fields; message and event type names; error codes and close-code
mapping; heartbeat intervals; serialization format (JSON is the expected
default, to be confirmed); compatibility policy between server and SDK versions.

## Alternatives considered

- **Reproduce a third-party protocol:** rejected (ADR-0004).
- **Socket.IO:** rejected by the technology baseline; adds its own protocol and
  client dependency.
- **Bare, unversioned JSON messages:** simplest; makes evolution and
  compatibility testing hard.

## Consequences

- We own protocol documentation and a protocol compatibility test suite.
- The protocol specification must be approved before Phase 04 implementation.
- Fixtures from the compatibility suite are shared with the client SDK
  (ADR-0019).

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- Protocol, authentication, and publishing contracts are project-owned design items; do not treat them as decided until their ADRs are approved.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
