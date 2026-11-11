# Phase 10 — Optional Horizontal Scaling

**Status:** Deferred  
**Depends on:** Phase 09 and a demonstrated scaling requirement

## Objective

Allow one project deployment to run multiple WebSocket instances while preserving channel delivery and, if required, presence semantics.

## Entry criteria

Do not start this phase merely as a precaution. Require measured evidence that one instance is insufficient or a confirmed availability requirement.

## Scope

- Load balancer and WebSocket upgrade forwarding.
- Redis Pub/Sub adapter for inter-instance event distribution.
- Application/channel scoping in broker messages.
- Distributed presence coordination if presence is required.
- Instance ownership and disconnect cleanup.
- Reconnection and failure recovery.
- Redis availability and failure behavior.
- Cross-instance integration and load tests.

## Important limitations

- Redis Pub/Sub is not durable and does not replay messages missed while disconnected.
- WebSocket connections remain owned by individual instances.
- Presence needs shared membership coordination; Pub/Sub alone is not a complete presence solution.
- Sticky routing does not replace inter-instance messaging.

## Deliverables

- Scaled deployment profile.
- Redis adapter.
- Load-balancer configuration guidance.
- Failure/recovery test report.
- Updated operations documentation.

## Exit criteria

Cross-instance delivery, authorization, presence (if applicable), and failure behavior pass tests. Obtain approval for any paid Redis hosting or infrastructure before provisioning.
