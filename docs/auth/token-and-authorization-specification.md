# Connection token and authorization specification — v1

**Status:** Approved by the project owner's instruction ("approved", 2026-11-11)
for the plan and recommended options presented that day. ADR-0020 was accepted
on the same basis. The config variable names (section 8) were not part of the
presented options; they were chosen by the assistant and are the item to review.

Token format, algorithm and fields below are project-owned (ADR-0004). Examples
use placeholders only. Never use real keys or tokens.

## 1. Responsibilities

The consuming project's backend authenticates its users and decides what they
may access, then issues a short-lived signed token. The realtime server only
**verifies** tokens. It never authenticates users, issues tokens, or decides
business permissions. Long-lived secrets never reach browsers or mobile clients.

## 2. Token format

```text
v1.<kid>.<payload>.<signature>
```

- `v1` — token format version (independent of the WebSocket protocol version).
- `kid` — key id, `^[A-Za-z0-9_-]{1,32}$`. Selects the verification key.
- `payload` — base64url (no padding) of the UTF-8 JSON claims object.
- `signature` — base64url (no padding) of
  `HMAC-SHA256(secret, "v1." + kid + "." + payload)` (32 bytes, 43 characters).
- Maximum token length: 4096 characters.

A secret is a shared per-deployment secret held by the backend (to sign) and the
server (to verify), at least 32 characters, generated randomly.

## 3. Claims

A strict JSON object (unknown fields rejected):

| Claim      | Type             | Meaning                                                       |
| ---------- | ---------------- | ------------------------------------------------------------- |
| `sub`      | string (1–128)   | Opaque user id chosen by the backend.                         |
| `dep`      | string (1–64)    | Deployment id; must equal the server's configured id.         |
| `iat`      | integer (s)      | Issued-at, Unix seconds.                                      |
| `exp`      | integer (s)      | Expiry, Unix seconds. Must be greater than `iat`.             |
| `channels` | string[] (≤100)  | Channels the connection may access (section 5).               |

No profile or presence data in v1 (presence is out of scope).

## 4. Verification (server)

In order; any failure rejects the connection with a generic `401`:

1. Length ≤ 4096; exactly four dot-separated parts; first part is `v1`.
2. `kid` and base64url fields are well formed; the signature is 32 bytes and
   canonically encoded.
3. `kid` is a configured key (`unknown_key`).
4. Recompute the HMAC with `node:crypto`; compare with `timingSafeEqual`
   (`bad_signature`).
5. Only after the signature is valid: parse the payload and validate the claims
   with Zod (`invalid_claims`).
6. `dep` equals the configured deployment id (`wrong_deployment`).
7. Time checks with a clock-skew tolerance: `exp` not passed (`expired`), `iat`
   not in the future (`not_yet_valid`), and `exp - iat` ≤ the configured maximum
   lifetime (`lifetime_exceeded`).

The failure reason is a category used only for structured logs and metrics; it is
never sent to the client. The token, signature and secret are never logged.

## 5. Channel scope (private-channel evidence)

`channels` holds exact channel names, or a prefix pattern ending in `.*` (for
example `orders.*` covers `orders.1` but not `orders` itself). Pattern validity:
`^(?:[A-Za-z0-9][A-Za-z0-9._:-]{0,127}|[A-Za-z0-9][A-Za-z0-9._:-]{0,125}\.\*)$`.
A connection may access a channel only if a claim matches it. The permitted
scope comes only from verified claims. Permission changes apply when the client
next obtains a token.

## 6. Delivery and lifetime

- The token is sent in the upgrade URL query: `?token=<token>` (with `v=<n>` for
  the protocol version). The server never logs request URLs. Because URLs may be
  logged by proxies, backends should issue tokens valid for about 60 seconds; the
  server rejects tokens whose lifetime exceeds the configured maximum.
- A connection stays open after its token expires; it is not re-checked. The
  next connection needs a new token.
- Where the verified claims are kept: they are attached to the connection by the
  transport (`connection.attachment`) for the channel layer to use.

## 7. Rotation

Configure two or more keys. The backend signs with one `kid`; the server accepts
any configured key. To rotate: add the new key to the server, switch the backend
to it, then remove the old key.

## 8. Server configuration (names chosen by the assistant — review)

| Variable                    | Required | Default | Meaning                                                              |
| --------------------------- | -------- | ------- | -------------------------------------------------------------------- |
| `AUTH_TOKEN_KEYS`           | yes      | —       | Comma-separated `kid:secret` pairs; secret ≥ 32 characters.          |
| `AUTH_DEPLOYMENT_ID`        | yes      | —       | This deployment's id (`^[A-Za-z0-9._-]{1,64}$`); must match `dep`.   |
| `AUTH_TOKEN_MAX_LIFETIME_S` | no       | `300`   | Largest accepted `exp - iat` (1–86400).                              |
| `AUTH_CLOCK_SKEW_S`         | no       | `5`     | Tolerance for clock differences (0–60).                              |

Startup fails (naming the variable only, never its value) when a required value
is missing or invalid.

## 9. Not covered / deferred

- **Publisher (server-to-server) authentication:** designed with the publishing
  API in Phase 07; it must use a separate credential and verification path.
- **Presence:** no requirement established.
- **Enforcement on the channel layer:** the channel layer (Phase 05) is deferred,
  so the scope check exists as a tested function but is not yet applied to any
  subscribe request.
- **Origin policy:** unchanged from Phase 03 (with an allow-list, a missing
  `Origin` is rejected).
