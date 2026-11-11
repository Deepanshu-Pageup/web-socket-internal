# Connection Lifecycle

**Status:** Draft — not reviewed or approved (Phase 01 not started)
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) ·
[Channel and event flow](CHANNEL-AND-EVENT-FLOW.md)

> Protocol-level message names, error codes, close codes, and timings are
> **not finalized**. They must be verified against the official Pusher protocol
> documentation and the SDK versions found in Phase 00. Nothing here is
> invented protocol behavior; unverified specifics are marked **[VERIFY]**.

## 1. States

```text
 [Upgrading] -> [Established] -> [Closing] -> [Closed]
      |               |
      +-> [Rejected]  +-> [Terminated] (heartbeat failure, limit breach, slow client)
```

| State | Meaning |
|---|---|
| Upgrading | HTTP upgrade received; validation in progress |
| Rejected | Upgrade refused before a WebSocket exists |
| Established | Socket ID assigned, connection registered, connection-established message sent |
| Closing | Client or server initiated close; cleanup running |
| Terminated | Server closed the connection due to a fault or policy |
| Closed | Fully unregistered; no state remains |

## 2. Connect

1. Client connects to the project's configured endpoint with the application key
   and protocol parameters **[VERIFY]**.
2. Transport performs explicit upgrade handling and validates: application key
   matches the deployment, origin policy, protocol version supported, server not
   shutting down.
3. On failure: reject (or accept then send a protocol error and close, whichever
   the protocol requires **[VERIFY]**). Never reveal secrets or configuration.
4. On success: accept the socket, the connection manager assigns a socket ID,
   registers the connection, and the protocol layer sends the
   connection-established message.
5. The client may then subscribe (see
   [CHANNEL-AND-EVENT-FLOW.md](CHANNEL-AND-EVENT-FLOW.md)).

Socket IDs must be unique within the deployment and not guessable beyond what
the protocol requires. Format **[VERIFY]**.

## 3. Heartbeat and liveness

- The server detects dead connections through ping/pong at the transport level
  and/or the protocol-level ping/pong the client SDK expects **[VERIFY which are
  required]**.
- A connection that misses the heartbeat deadline is terminated and cleaned up.
- Intervals and timeouts are configuration values with validated bounds.
  Defaults **[OPEN]**.

## 4. Limits enforced during the lifetime

- Maximum inbound message size; oversize frames close the connection.
- Maximum subscriptions per connection and inbound message rate **[OPEN values]**.
- Bounded outbound buffer per connection; a slow client that exceeds it is
  terminated rather than allowed to grow memory unbounded.
- Invalid or malformed protocol messages produce a protocol error and, if
  repeated or severe, termination.

## 5. Disconnect and cleanup

On any close (normal, error, timeout, termination):

1. Connection manager unregisters the connection.
2. Channel manager removes all of its local subscriptions and deletes empty
   channel records.
3. Presence membership is updated if presence is enabled (a member is removed
   only when the user has no remaining connection in that channel).
4. Timers and buffers for the connection are released.

Cleanup must be idempotent: duplicate close/error events must not throw or
double-remove state.

## 6. Reconnect

The server keeps no session across connections. A reconnecting client receives a
new socket ID, obtains fresh authorization for protected channels, and
resubscribes. Events published while disconnected are not replayed.

## 7. Graceful shutdown

1. Stop accepting new upgrades and mark readiness as not ready.
2. Notify or close existing connections with an appropriate close code
   **[VERIFY code and client reconnect behavior]**.
3. Wait up to a configured deadline for pending writes, then force-close.
4. Clear in-memory state and exit; no stale local state is left behind.

## 8. Open items

- **[OPEN]** Required protocol version(s) and exact connect parameters.
- **[OPEN]** Heartbeat intervals, timeouts, and which ping/pong forms are required.
- **[OPEN]** Close codes and error codes that SDKs rely on for reconnect decisions.
- **[OPEN]** Mobile/background connection requirements.
- **[OPEN]** Numeric limits (message size, subscriptions, rate, buffer).
