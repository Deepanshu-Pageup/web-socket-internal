# ADR-0009: Custom Versioned HTTP Publishing API

- **Status:** Proposed
- **Date:** 2026-11-11
- **Decision owners:** Internal Realtime Server maintainers

## Context

Consuming backends must publish events to their own realtime deployment after
their business operations succeed. The project owns its protocol and SDK
(ADR-0004), so the publishing interface is also project-owned.

## Decision

Provide a versioned HTTP publishing API designed by this project.

The API will:

- Authenticate backend publishers using deployment-specific server credentials
  or cryptographic request signatures.
- Define replay protection.
- Validate event names, channel names, and payloads (Zod).
- Enforce request and payload limits.
- Return a defined, consistent error model.
- Be versioned so contracts can evolve under a documented compatibility policy.

**Design items requiring approval (not decided here):** endpoint paths and
version scheme; credential vs. signature authentication and the algorithm;
replay-protection mechanism (for example timestamp window and/or nonce);
request/response and error body shapes; limit values; multi-channel or batch
support (only if a requirement is established); credential rotation.

## Alternatives considered

- **Credential-based authentication (bearer-style server credential):** simpler;
  weaker against replay and request tampering unless combined with TLS and other
  controls.
- **Cryptographic request signatures with replay protection:** stronger
  integrity; more client complexity.
- **Both, selectable per deployment:** flexible; larger surface to test.

## Consequences

- Backends integrate against our documented API, using a thin first-party
  helper or plain HTTP (helper packaging is an open item).
- We maintain API documentation, versioning, and negative tests.
- The server verifies, never trusts, publishing requests; the publishing path
  is kept separate from client token verification (ADR-0020).
- Success means "accepted for local dispatch", not "delivered".

## Constraints and notes

- This ADR applies to the generic internal real-time server, not to business logic in consuming applications.
- Do not add infrastructure or scope beyond the decision without documenting and reviewing the trade-off.
- Protocol, authentication, and publishing contracts are project-owned design items; do not treat them as decided until their ADRs are approved.

## Review checklist

- [ ] Requirements and assumptions have been verified.
- [ ] Alternatives have been discussed.
- [ ] Security and operational implications have been reviewed.
- [ ] Decision has been approved by the relevant maintainers.
