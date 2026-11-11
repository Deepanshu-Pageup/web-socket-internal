# ADR-0004: Rejected Pusher Dependency and Independent Protocol Decision

- **Status:** Accepted
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

> This ADR is historical decision documentation. It records why a third-party
> dependency was rejected. It does **not** authorize Pusher compatibility
> implementation, and it is the only ADR that concerns Pusher.

## Context

The initial architecture considered Pusher Channels protocol compatibility to
simplify integration with existing applications.

After architectural evaluation, we decided to own the complete real-time stack
instead of reproducing Pusher's protocol and SDK ecosystem.

## Decision

We explicitly rejected Pusher as an architectural dependency.

The project will:

- Use its own WebSocket application protocol (see ADR-0018).
- Maintain its own first-party client SDK (see ADR-0019).
- Implement its own authentication and authorization model (see ADR-0020).
- Provide its own backend publishing API (see ADR-0009).
- Own channel naming and event conventions (see ADR-0021).

## Reasons

- Avoid dependency on Pusher-specific protocol and SDK contracts.
- Avoid inheriting Pusher-specific service limitations or pricing assumptions.
- Own the complete real-time communication lifecycle.
- Control protocol evolution and compatibility.
- Build infrastructure reusable across internal company projects.

## Alternatives considered

- **Pusher Channels protocol compatibility** (the original decision, now
  superseded): rejected for the reasons above.
- **Continue using the hosted third-party service:** outside the scope of this
  project, which exists to provide an owned, self-hosted capability.

## Consequences

- Existing Pusher integrations must be migrated.
- We must maintain our own protocol documentation.
- We must build and maintain client SDKs.
- We must implement authentication, authorization, publishing and reconnection
  behavior.
- We must define compatibility and versioning policies ourselves.

## Important clarification

This ADR is historical decision documentation. It does not authorize Pusher
compatibility implementation. No code, configuration, test, or document in this
repository may implement, emulate, or depend on the Pusher protocol, client
SDKs, or server SDKs.

## Supersedes

The earlier ADR-0004 "Pusher Channels Protocol Compatibility" (same number,
replaced in place; it was never implemented).

## Review checklist

- [x] Decision made by the project owner.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
