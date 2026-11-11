# Channel and Event Flow

**Status:** Draft — not reviewed or approved (Phase 01 not started)
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) ·
[Authorization flow](AUTHORIZATION-FLOW.md) · [Publishing API](PUBLISHING-API.md)

> Channel types and event features are in scope only if Phase 00 evidences them.
> Pusher supporting a feature is not a reason to implement it. Items marked
> **[VERIFY]** need confirmation against official protocol documentation.

## 1. Channel types and scope

| Type | Status | Notes |
|---|---|---|
| Public | Expected in Release 1 (subject to discovery) | No authorization |
| Private | Expected if used (subject to discovery) | Requires verified authorization signature |
| Presence | **[OPEN]** only if discovery confirms | Needs member tracking; see section 6 |
| Encrypted / cache | **[OPEN]** deferred unless evidenced | Not planned for Release 1 |
| Client events | **[OPEN]** deferred unless evidenced | |
| Webhooks / subscription counts | **[OPEN]** deferred unless evidenced | |

## 2. Data model (in memory, per deployment)

- **Connection** → set of subscribed channel names.
- **Channel** → set of subscribed connections; channel type derived from name
  per protocol rules **[VERIFY]**.
- One connection may subscribe to many channels; one channel may have many
  connections. Both directions are maintained so disconnect cleanup is O(channels
  for that connection).
- Empty channel records are removed.
- All lookups are scoped to a single deployment/application context. There is no
  global registry spanning deployments.

## 3. Subscribe flow

1. Protocol layer parses and validates the subscribe message (Zod schema).
2. Channel name is validated: allowed characters, length limit, and prefix-based
   type detection **[VERIFY rules and limits]**.
3. For protected channels, Authorization verifies the supplied signature before
   any state change (see [AUTHORIZATION-FLOW.md](AUTHORIZATION-FLOW.md)).
4. Channel manager adds the connection (idempotent: duplicate subscribe does not
   create duplicate membership).
5. Protocol layer sends the subscription-success message; on failure it sends
   the protocol-compatible error and the connection is not added **[VERIFY
   message names and error payloads]**.

## 4. Unsubscribe flow

Validate message → remove connection from channel and channel from connection →
delete channel if empty → (presence) update membership. Unsubscribing from a
channel that is not subscribed is a no-op, not an error.

## 5. Event delivery

```text
 Publishing API (signed, validated)      Permitted protocol flows (e.g. client events, if in scope)
                  \                             /
                   v                           v
                     Event dispatcher
                       1. look up channel in this deployment
                       2. exclude socket if requested and required [VERIFY]
                       3. serialize once, send to each eligible connection
                       4. respect per-connection bounded outbound buffer
```

Rules:

- Deliver only to current local subscribers of that exact channel.
- Never deliver across channels or deployments.
- A slow or full-buffer connection is terminated; it does not block delivery to
  others.
- Delivery is best-effort. No acknowledgements, retry, replay, ordering across
  reconnects, or exactly-once guarantees.
- Record metrics (counts, sizes, queue pressure) only; never log payload bodies.
- A failure delivering to one connection must not abort delivery to the rest.

## 6. Presence (only if confirmed)

- Authorization response carries user identity data; the server verifies it.
- Membership is keyed by user ID, supporting multiple connections per user.
- Member-added is sent when a user's first connection joins; member-removed only
  when their last connection leaves or disconnects.
- Subscription success includes the current member set as the protocol requires
  **[VERIFY]**.
- In multi-instance deployments this requires shared membership coordination
  (Phase 10); local memory is insufficient.

## 7. Failure and edge cases to specify in tests

- Subscribe to the same channel twice.
- Subscribe with invalid name or oversized name.
- Subscribe to a protected channel with a missing, malformed, or wrong signature.
- Disconnect during subscribe or while events are in flight.
- Publish to a channel with zero subscribers (success, no delivery).
- Isolation: events for channel A never reach subscribers of B; events in one
  deployment never reach another.

## 8. Open items

- **[OPEN]** Which channel types, client events, and webhooks are required.
- **[OPEN]** Channel/event name and payload size limits.
- **[OPEN]** Whether excluded-socket behavior is required by existing backends.
- **[OPEN]** Maximum subscriptions per connection and fan-out sizing.
