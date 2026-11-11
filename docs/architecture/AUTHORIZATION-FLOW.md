# Authorization Flow

**Status:** Draft — not reviewed or approved (Phase 01 not started)
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) ·
[Security](SECURITY.md) · [Channel and event flow](CHANNEL-AND-EVENT-FLOW.md)

> Exact signature string formats, field names, and encodings must be taken from
> official Pusher documentation and verified against company SDK behavior and
> compatibility tests. They are intentionally not restated here as decided
> behavior. Examples use placeholders only; never use real keys or secrets.

## 1. Responsibility split

| Concern | Consuming project backend | Realtime server |
|---|---|---|
| Authenticate the end user | Owns | Does not |
| Decide whether the user may access a channel | Owns | Does not |
| Sign the channel authorization | Produces signature using the app secret | Verifies independently |
| Hold the application secret | Yes | Yes (server-side only) |
| Hold the secret in browser/mobile code | **Never** | **Never** |

The server must never trust an unsigned or unverified authorization response.

## 2. Credentials

Each deployment is configured with its own application ID, key, and secret
(placeholders: `APP_ID`, `APP_KEY`, `APP_SECRET`). The key is public (sent by
clients); the secret is never sent to clients, logged, or included in errors.
Secrets are supplied via environment/secret mechanism at deploy time, not
committed. Secret rotation approach **[OPEN]**.

## 3. Private channel authorization

```text
 Client                    Project backend                 Realtime server
   | request auth (socket_id, channel) |                          |
   |---------------------------------->| authenticate user        |
   |                                   | check permission         |
   |                                   | sign with APP_SECRET     |
   |<----------------------------------|                          |
   | subscribe(channel, auth) ---------------------------------->|
   |                                   |                          | verify signature
   |                                   |                          | (constant-time)
   |<------------------------------------- success or error ------|
```

Server-side verification requirements:

1. Recompute the expected signature from the connection's own socket ID, the
   channel name, and the app secret, using `node:crypto` HMAC.
2. Compare using a constant-time comparison.
3. The socket ID must come from the server's record of that connection, not from
   client-supplied data.
4. On mismatch or malformed input, reject the subscription with a
   protocol-compatible error; do not reveal which element failed beyond what the
   protocol requires; do not log the signature.

Signed string layout and key-prefix format **[VERIFY]**.

## 4. Presence authorization (only if confirmed in scope)

In addition to section 3, the response carries user identification data that is
part of the signed content. The server verifies the signature over that data,
validates the data shape (Zod), enforces size limits, and uses only verified
data to build membership. Details **[VERIFY]**.

## 5. Publisher (server-to-server) authentication

Backend publishing requests are authenticated by a request signature and
timestamp. See [PUBLISHING-API.md](PUBLISHING-API.md). Publisher credentials and
channel authorization use the same app secret but must be verified by separate
code paths with separate tests.

## 6. Origin policy

Allowed origins are configured per deployment and checked at WebSocket upgrade.
Behavior for absent `Origin` (non-browser clients) **[OPEN]**. Origin checks are
defense in depth; they do not replace signature verification.

## 7. Error and logging rules

- Authorization failures return protocol-compatible errors without secrets,
  expected signatures, or stack traces.
- Log structured events (reason category, channel type, connection ID); never the
  signature, secret, or auth payload.
- Count authorization failures as a metric.

## 8. Tests required (once implementation is authorized)

Valid signature; wrong secret; wrong socket ID; wrong channel; tampered or
truncated signature; empty or oversized auth; replayed auth against a different
connection; constant-time comparison used; presence data tampering; no secret in
logs or error output.

## 9. Open items

- **[OPEN]** Existing company authorization endpoints and response formats (Phase 00).
- **[OPEN]** Whether presence is required.
- **[OPEN]** Secret rotation and multiple-secret support.
- **[OPEN]** Missing-`Origin` policy and per-deployment origin configuration shape.
