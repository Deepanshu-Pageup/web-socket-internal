# Application protocol specification — DRAFT v1 (proposal)

**Status:** Approved by the project owner's instruction ("Do it", 2026-11-11),
taking the **recommended option for every [DECIDE] item**. No separate review
notes were recorded. ADR-0018 was accepted on the same basis. ADR-0021
(channel and event naming) remains **Proposed**: the name patterns and the
`private.` prefix in section 6 are implemented as validation rules only and may
change when ADR-0021 is reviewed.

Items marked **[DECIDE]** record where a choice was made; the first-listed
option was taken. Nothing here derives from any third-party realtime protocol
(ADR-0004).

## 1. Scope and layering

- Runs on the standard WebSocket transport from Phase 03 (`ws`; ADR-0003).
- A new pure module `backend/src/protocol/` parses bytes to typed messages and
  serializes typed messages to text. It never touches sockets, holds no channel
  state, and performs no authorization.
- Channel state, delivery and authorization belong to Phases 05 and 06. Until
  then the protocol layer only produces and consumes messages.
- Out of scope for v1: presence, client-originated events, durable delivery,
  replay of missed events, and the token format (ADR-0020).

## 2. Serialization

- **[DECIDE] Format:** UTF-8 JSON in WebSocket **text** frames (recommended).
- Binary frames are rejected: close with `4003 unsupported_data`.
- Maximum inbound message size is the transport limit (`WS_MAX_PAYLOAD_BYTES`,
  default 64 KiB). Oversize frames are closed by the transport with 1009.
- Unknown top-level fields are rejected, not ignored, so a typo is visible.

## 3. Versioning and compatibility

- **[DECIDE] Scheme:** a single integer major version, starting at `1`
  (recommended). Any change that breaks an existing message or field bumps it.
  Additive, optional fields do not.
- **[DECIDE] Negotiation:** the client states its version in the upgrade URL
  query, `?v=1`. Browsers cannot read HTTP status codes from a failed upgrade,
  so a mismatch is reported in-band: the server accepts the upgrade, sends one
  `error` message (`unsupported_version`) listing `supportedVersions`, then
  closes with `4002`.
- **[DECIDE] Policy:** a server supports its current major version and the
  previous one for at least one release (recommended). The SDK and the server
  both ship the shared fixtures from the compatibility suite (ADR-0019).
- Per-message version fields are not used; the version is fixed per connection.

## 4. Envelope

Every message is one JSON object:

| Field     | Type            | Direction | Meaning                                              |
| --------- | --------------- | --------- | ---------------------------------------------------- |
| `type`    | string          | both      | Message type from the catalog below. Required.       |
| `id`      | string (1–64)   | both      | Client-chosen request id; echoed in the reply.       |
| `channel` | string          | both      | Channel name (section 6).                            |
| `event`   | string          | s→c       | Event name on `event` messages.                      |
| `data`    | any JSON value  | s→c       | Event payload, passed through unmodified.            |
| `error`   | object          | s→c       | `{ "code": string, "message": string }`.             |
| `supportedVersions` | number[] | s→c    | Only on `unsupported_version` errors.                |

Which fields are required or forbidden per `type` is defined in section 5 and
enforced by one Zod schema per inbound type (discriminated union on `type`).

## 5. Message catalog

### Client → server

| `type`        | Fields                          | Purpose                                        |
| ------------- | ------------------------------- | ---------------------------------------------- |
| `subscribe`   | `channel`, optional `id`        | Subscribe to a channel.                        |
| `unsubscribe` | `channel`, optional `id`        | Unsubscribe from a channel.                    |
| `ping`        | optional `id`                   | Application-level heartbeat (see section 7).   |

A private-channel `subscribe` will need to carry proof of authorization. The
field and its format are **not defined here**; they are an ADR-0020 design item
for Phase 06. Until then `subscribe` has no such field and the server accepts
only public channels.

### Server → client

| `type`          | Fields                                              | Purpose                                      |
| --------------- | --------------------------------------------------- | -------------------------------------------- |
| `connected`     | `connectionId`, `heartbeatIntervalMs`               | First message after a successful handshake.  |
| `subscribed`    | `channel`, echoed `id`                              | Subscribe succeeded (idempotent).            |
| `unsubscribed`  | `channel`, echoed `id`                              | Unsubscribe done (also when not subscribed). |
| `event`         | `channel`, `event`, `data`                          | Delivery of a published event.               |
| `pong`          | echoed `id`                                         | Reply to `ping`.                             |
| `error`         | `error`, optional echoed `id`, optional `channel`   | Request failed or protocol violation.        |

Subscribing twice to the same channel returns `subscribed` both times;
unsubscribing from a channel that is not subscribed returns `unsubscribed`
(ADR-0021).

## 6. Channel and event names

**[DECIDE]** Proposal, pending ADR-0021:

- Pattern `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$` for channels (max 128 chars) and
  `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` for events (max 64).
- Channel type is derived by the server from the name, never asserted by the
  client. Proposed convention: the prefix `private.` marks a private channel;
  anything else is public. The prefix is a placeholder for owner decision.
- A maximum number of subscriptions per connection (proposal: 100) is enforced;
  exceeding it returns `subscription_limit`.

## 7. Connection establishment and heartbeat

1. Client connects to `WS_PATH?v=1`.
2. Server validates origin and capacity (Phase 03), then the version.
3. On success the server sends `connected` with `connectionId` and
   `heartbeatIntervalMs`.
4. **Heartbeat.** Transport-level WebSocket ping/pong (Phase 03) already detects
   dead connections between servers and most clients, but browsers cannot send
   or observe WebSocket ping frames. The application `ping`/`pong` lets a client
   detect a dead connection itself. **[DECIDE]** proposal: the client sends
   `ping` when idle for `heartbeatIntervalMs` and treats a missing `pong` within
   `2 × heartbeatIntervalMs` as a dead connection. The server does not close
   connections for not sending `ping` as long as transport pongs arrive.

## 8. Errors and close codes

Error codes (stable strings):

| `error.code`           | When                                                        | Closes? |
| ---------------------- | ----------------------------------------------------------- | ------- |
| `invalid_message`      | Not JSON, wrong shape, unknown fields, bad field values.    | Yes (4001) after repeated or severe cases; see below |
| `unknown_type`         | `type` not in the client catalog.                           | No      |
| `unsupported_version`  | Version missing or not supported.                           | Yes (4002) |
| `invalid_channel`      | Channel name fails validation.                              | No      |
| `subscription_limit`   | Per-connection subscription cap reached.                    | No      |
| `forbidden`            | Reserved for authorization failures (Phase 06).             | No      |
| `internal_error`       | Server fault.                                               | Yes (1011) |

- **[DECIDE]** Malformed JSON or a wrong shape returns `invalid_message` and
  keeps the connection open; the connection is closed with `4001` after 5
  consecutive invalid messages (recommended, limits abuse without punishing a
  single client bug).
- Error `message` text is fixed per code. It never echoes client input,
  payloads or tokens.
- **[DECIDE]** Application close codes use the 4000–4999 range: `4001`
  protocol violation, `4002` unsupported version, `4003` unsupported data.
  Transport codes from Phase 03 are unchanged: 1001 shutdown, 1008 slow client,
  1009 oversize, 1011 internal error.

## 9. Reconnection

- Delivery is best-effort and non-durable. The server keeps no per-client
  history and promises no replay.
- After any disconnect the client reconnects with exponential backoff and
  jitter, then **re-sends every `subscribe`**; subscriptions do not survive a
  connection. Events published while disconnected are lost, so clients must
  reconcile important state with their own backend.
- On `4002` the client must not retry the same version.
- Backoff constants belong to the SDK (Phase 08), not the protocol.

## 10. Example (illustrative, not normative)

```json
{"type":"subscribe","channel":"orders.updates","id":"c1"}
{"type":"subscribed","channel":"orders.updates","id":"c1"}
{"type":"event","channel":"orders.updates","event":"order.changed","data":{"orderId":"example"}}
```

## 11. Deliverables once approved

1. `backend/src/protocol/`: Zod schemas for every inbound type, a parser that
   returns a typed result or an error code (never throws on bad input), a
   serializer, and the message/error catalog as constants.
2. Compatibility fixtures: valid and invalid message files under
   `backend/src/protocol/fixtures/` (shared with the SDK later).
3. Tests for connect, heartbeat, subscribe, unsubscribe, deliver, error,
   version mismatch and malformed input, plus the policy text for server/SDK
   version compatibility.

## 12. Open decisions summary

1. JSON text frames. 2. Integer major version in `?v=`. 3. N and N-1 support
policy. 4. Channel and event name patterns and limits. 5. `private.` prefix
convention (or another way to mark private channels). 6. Subscription cap (100).
7. Application heartbeat timings. 8. Strike count before close (5). 9. Close
codes 4001–4003. 10. Whether client-originated events are ever needed (v1
proposal: no; no requirement evidenced).
