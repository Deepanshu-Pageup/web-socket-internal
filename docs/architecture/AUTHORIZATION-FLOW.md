# Authorization Flow

**Status:** Draft — revised for the independent architecture (ADR-0004); not re-reviewed or approved
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) ·
[Security](SECURITY.md) · [Channel and event flow](CHANNEL-AND-EVENT-FLOW.md)

> **Update (2026-11-11):** the connection-token format, verification, scope
> model and delivery are now specified in
> [../auth/token-and-authorization-specification.md](../auth/token-and-authorization-specification.md);
> where this draft differs, that document wins. Publisher authentication and
> presence below are still undecided.
>
> Token formats, claim names, cryptographic algorithms, and wire fields were
> **not finalized** when this draft was written. They are **[DESIGN]** items (ADR-0020) and must be specified
> and approved before implementation. Examples use placeholders only; never use
> real keys, secrets, or tokens.

## 1. Responsibility split

| Concern | Consuming project backend | Realtime server |
|---|---|---|
| Authenticate the end user | Owns | Does not |
| Decide whether the user may access a channel | Owns | Does not |
| Issue short-lived, scoped connection tokens | Owns | Does not |
| Validate tokens and authorization evidence | Does not | Owns (independently) |
| Hold long-lived server credentials | Yes | Yes (server-side only) |
| Hold long-lived server credentials in browser/mobile code | **Never** | **Never** |

The server must never trust unverified tokens or authorization evidence. Clients
receive only short-lived, scoped tokens.

## 2. Credentials

Each deployment is configured with its own credentials, supplied by the
deployment's secret mechanism and never committed. Which credentials exist
(token verification key(s), publisher credential(s)), whether they are symmetric
or asymmetric, and how they are named in configuration are **[DESIGN]**.
Credentials for client-token verification and for publisher authentication
should be separable so each can be rotated independently **[DESIGN]**.
Secrets are never sent to clients, logged, or included in errors. Rotation
approach **[DESIGN]**.

## 3. Connection tokens

```text
 Client / SDK                Project backend                 Realtime server
   | request token (existing auth) |                              |
   |------------------------------>| authenticate user            |
   |                               | determine scope              |
   |                               | issue short-lived token      |
   |<------------------------------|                              |
   | connect (protocol version, token) ------------------------->|
   |                               |                              | validate token
   |<----------------------------- connection established / error|
```

Server-side validation requirements (mechanism **[DESIGN]**):

1. Verify token integrity/authenticity using the deployment's verification
   credential, using `node:crypto`, with constant-time comparison for any secret
   comparison.
2. Reject expired tokens (clock-skew tolerance **[DESIGN]**) and tokens intended
   for another deployment.
3. Validate the claims shape with Zod and enforce size limits.
4. Derive the connection's permitted scope only from verified claims, never from
   client-supplied data.
5. On failure, reject with a generic error; do not reveal which check failed
   beyond what the protocol requires; never log the token.

## 4. Private channel authorization

The server accepts a private-channel subscription only when verifiable,
unexpired evidence issued by the consuming backend covers that channel for that
connection. Two candidate models are **[DESIGN]** items for ADR-0020:

- **Token-embedded scope:** channels or channel patterns permitted for the
  connection are claims in the connection token. Fewer round trips; permission
  changes apply at token expiry.
- **Per-channel grant:** the backend issues a short-lived grant per channel,
  bound to the connection. Finer control; more backend round trips.

Either way: the evidence is verified before any state change; failures reject
the subscription; the evidence is never logged.

## 5. Presence claims (only if required)

If presence is required, identity data used for membership must be part of
verified claims. The server validates the data shape (Zod), enforces size limits,
and builds membership only from verified data. Details **[DESIGN]**.

## 6. Publisher (server-to-server) authentication

Backend publishing requests are authenticated separately. See
[PUBLISHING-API.md](PUBLISHING-API.md). Publisher authentication and client
token validation must use separate verification paths and separate tests.

## 7. Origin policy

Allowed origins are configured per deployment and checked at WebSocket upgrade.
Behavior for absent `Origin` (non-browser clients) **[OPEN]**. Origin checks are
defense in depth; they do not replace token validation.

## 8. Error and logging rules

- Authentication/authorization failures return protocol errors without secrets,
  tokens, expected values, or stack traces.
- Log structured events (reason category, channel type, connection ID); never the
  token, grant, signature, or secret.
- Count authentication and authorization failures as metrics.

## 9. Tests required (once implementation is authorized)

Valid token; expired token; token for another deployment; tampered or truncated
token; wrong key; missing or oversized token; private-channel evidence for a
different channel or connection; expired evidence; constant-time comparison
used; presence claim tampering; no secret or token in logs or error output.

## 10. Open and design items

- **[DESIGN]** Token format, claims, scope model, verification scheme, lifetime, delivery.
- **[DESIGN]** Private-channel evidence model.
- **[DESIGN]** Behavior when a token expires during a connection.
- **[DESIGN]** Credential rotation and multiple-key support.
- **[OPEN]** Whether presence is required.
- **[OPEN]** Missing-`Origin` policy and per-deployment origin configuration shape.
