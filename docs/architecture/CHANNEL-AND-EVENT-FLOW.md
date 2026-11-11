# Channel and Event Flow

**Status:** Draft — revised for the independent architecture (ADR-0004); not re-reviewed or approved
**Related:** [System architecture](SYSTEM-ARCHITECTURE.md) ·
[Authorization flow](AUTHORIZATION-FLOW.md) · [Publishing API](PUBLISHING-API.md)

> Channel naming, the event envelope, and message names are **[DESIGN]** items
> (ADR-0021, ADR-0018). A feature is in scope only if a requirement is
> established; another system offering a feature is not a reason to implement it.

## 1. Channel types and scope

| Type | Status | Notes |
|---|---|---|
| Public | Confirmed requirement | No channel authorization |
| Private | Confirmed requirement | Requires verified authorization evidence from the consuming backend |
| Presence | **Optional** — only if a requirement is established | Needs member tracking; see section 6 |
| Client-originated events | **[OPEN]** deferred unless required | |
| Webhooks / subscription counts | **[OPEN]** deferred unless required | |

How channel type is determined (for example by naming convention) is a
**[DESIGN]** item. It must be derived and enforced server-side; clients cannot
assert it.

## 2. Data model (in memory, per deployment)

- **Connection** → set of subscribed channel names.
- **Channel** → set of subscribed connections; channel type per the approved
  naming rules **[DESIGN]**.
- One connection may subscribe to many channels; one channel may have many
  connections. Both directions are maintained so disconnect cleanup is O(channels
  for that connection).
- Empty channel records are removed.
- All lookups are scoped to a single deployment. There is no global registry
  spanning deployments.

## 3. Subscribe flow

1. Protocol layer parses and validates the subscribe message (Zod schema).
2. Channel name is validated: allowed characters, length limit, and channel-type
   determination **[DESIGN rules and limits]**.
3. For private channels, Authorization verifies the supplied evidence before any
   state change (see [AUTHORIZATION-FLOW.md](AUTHORIZATION-FLOW.md)).
4. Channel manager adds the connection (idempotent: duplicate subscribe does not
   create duplicate membership).
5. Protocol layer sends the subscription-success message; on failure it sends a
   protocol error and the connection is not added **[DESIGN: message names and
   error payloads]**.

## 4. Unsubscribe flow

Validate message → remove connection from channel and channel from connection →
delete channel if empty → (presence) update membership. Unsubscribing from a
channel that is not subscribed is a no-op, not an error.

## 5. Event delivery

```text
 Publishing API (authenticated, validated)   Permitted protocol flows (e.g. client-originated events, if in scope)
                  \                             /
                   v                           v
                     Event dispatcher
                       1. look up channel in this deployment
                       2. exclude a connection only if a requirement exists [OPEN]
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

## 6. Presence (only if required)

- Verified claims carry user identity data.
- Membership is keyed by user ID, supporting multiple connections per user.
- A join notification is sent when a user's first connection joins; a leave
  notification only when their last connection leaves or disconnects.
- Subscription success includes the current member set as the protocol
  requires **[DESIGN]**.
- In multi-instance deployments this requires shared membership coordination
  (Phase 10); local memory is insufficient.

## 7. Failure and edge cases to specify in tests

- Subscribe to the same channel twice.
- Subscribe with invalid name or oversized name.
- Subscribe to a private channel with missing, malformed, expired, or wrong-channel evidence.
- Disconnect during subscribe or while events are in flight.
- Publish to a channel with zero subscribers (success, no delivery).
- Isolation: events for channel A never reach subscribers of B; events in one
  deployment never reach another.

## 8. Open and design items

- **[DESIGN]** Channel naming scheme and event envelope (ADR-0021).
- **[OPEN]** Whether presence, client-originated events, or webhooks are required.
- **[OPEN]** Channel/event name and payload size limits.
- **[OPEN]** Whether excluding a connection from delivery is required.
- **[OPEN]** Maximum subscriptions per connection and fan-out sizing.
