# ADR-0020: Backend-Issued Short-Lived Connection Tokens and Channel Authorization

- **Status:** Proposed
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

The consuming backend owns user identity and business authorization. Frontends
must not receive long-lived server secrets. The realtime server must still
verify, independently, who may connect and which protected channels they may
join.

## Decision

- The consuming backend issues **short-lived, scoped connection tokens** to its
  authenticated users.
- The realtime server **validates** the tokens; it never authenticates users or
  makes business permission decisions.
- Private-channel authorization is defined by this project, independent of any
  third-party scheme: the server accepts a subscription to a private channel
  only when verifiable, unexpired evidence issued by the consuming backend
  covers that channel.
- Long-lived server credentials remain on the backend and the server only.

**Design items requiring approval (not decided here):**

- Token format, claims, and scope model.
- Verification scheme (shared-secret vs. asymmetric) and algorithms.
- Token lifetime, clock-skew tolerance, and refresh/reconnect behavior.
- Token delivery mechanism at connect time (avoid places that are routinely
  logged).
- Private-channel evidence model: scope embedded in the token versus
  per-channel short-lived grants, and binding to the connection.
- Presence claims, only if presence is required.
- Credential rotation and multi-key support.

## Alternatives considered

- **Long-lived shared credential in the client:** rejected; violates the
  secrets constraint.
- **Server calls the backend to authorize each subscription:** keeps decisions
  central but couples the server to backend availability and adds latency.
- **Token-embedded channel scope:** fewer round trips; permission changes take
  effect only on token expiry.
- **Per-channel grants:** finer control; more backend round trips.

## Consequences

- Backends must implement a token-issuing endpoint using a documented contract
  (and, if provided, a helper).
- Revocation is bounded by token lifetime; very short lifetimes increase
  reconnect/refresh traffic.
- The server must never log tokens or grants.
- Publisher authentication (ADR-0009) is a separate path with separate tests.

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- Protocol, authentication, and publishing contracts are project-owned design items; do not treat them as decided until their ADRs are approved.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
