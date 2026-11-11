# Architecture Decision Records (ADRs)

This folder records significant architecture decisions for the Internal Realtime Server.

## Status meanings

- **Proposed:** A recommendation for review; not yet final.
- **Accepted:** The decision is approved for the stated scope.
- **Accepted direction:** The strategic direction is agreed, but detailed contracts or implementation choices still need review.
- **Deprecated / Superseded:** Retained for history; a later ADR replaces it.

## Review rules

1. Do not treat Proposed decisions as implementation instructions.
2. Update an ADR when a decision changes; do not silently rewrite history.
3. Link superseding ADRs when replacing a decision.
4. Keep implementation details out of ADRs unless they are necessary to explain the decision.
5. Phase 01 is complete only after all required Proposed decisions have been reviewed.

## ADR index

| ADR | Title | Status |
|---|---|---|
| [ADR-0001](ADR-0001-node.js-and-typescript-runtime.md) | Node.js and TypeScript Runtime | Accepted |
| [ADR-0002](ADR-0002-npm-package-management.md) | npm Package Management | Accepted |
| [ADR-0003](ADR-0003-websocket-transport-using-ws.md) | WebSocket Transport Using ws | Accepted |
| [ADR-0004](ADR-0004-rejected-pusher-dependency.md) | Rejected Pusher Dependency and Independent Protocol Decision (historical) | Accepted |
| [ADR-0005](ADR-0005-modular-monolith-architecture.md) | Modular Monolith Architecture | Proposed |
| [ADR-0006](ADR-0006-independent-project-deployments.md) | Independent Project Deployments | Accepted |
| [ADR-0007](ADR-0007-in-memory-initial-state-management.md) | In-Memory Initial State Management | Proposed |
| [ADR-0008](ADR-0008-redis-for-optional-distributed-messaging.md) | Redis for Optional Distributed Messaging | Accepted direction |
| [ADR-0009](ADR-0009-custom-http-publishing-api.md) | Custom Versioned HTTP Publishing API | Proposed |
| [ADR-0010](ADR-0010-no-database-in-initial-deployment.md) | No Database in Initial Deployment | Accepted direction |
| [ADR-0011](ADR-0011-shared-source-and-versioned-docker-distribution.md) | Shared Source and Versioned Docker Distribution | Accepted |
| [ADR-0012](ADR-0012-single-node-default-deployment.md) | Single-Node Default Deployment | Accepted |
| [ADR-0013](ADR-0013-optional-horizontal-scaling.md) | Optional Horizontal Scaling | Accepted |
| [ADR-0014](ADR-0014-redis-pub-sub-adapter.md) | Redis Pub/Sub Adapter | Proposed |
| [ADR-0015](ADR-0015-load-balancer-and-connection-routing.md) | Load Balancer and Connection Routing | Proposed |
| [ADR-0016](ADR-0016-distributed-presence-coordination.md) | Distributed Presence Coordination | Proposed |
| [ADR-0017](ADR-0017-versioned-docker-image-releases.md) | Versioned Docker Image Releases | Accepted |
| [ADR-0018](ADR-0018-independent-versioned-application-protocol.md) | Independent Versioned Application Protocol | Proposed |
| [ADR-0019](ADR-0019-first-party-typescript-client-sdk.md) | First-Party TypeScript Client SDK | Proposed |
| [ADR-0020](ADR-0020-backend-issued-connection-tokens.md) | Backend-Issued Short-Lived Connection Tokens and Channel Authorization | Proposed |
| [ADR-0021](ADR-0021-independent-channel-and-event-model.md) | Independent Channel and Event Model | Proposed |

## Active architecture coverage

| Topic | ADR |
|---|---|
| Independent application protocol | ADR-0018 |
| Modular monolith | ADR-0005 |
| WebSocket transport using `ws` | ADR-0003 |
| Independent deployment model | ADR-0006, ADR-0011, ADR-0017 |
| Custom publishing API | ADR-0009 |
| First-party TypeScript client SDK | ADR-0019 |
| Backend-issued short-lived connection tokens | ADR-0020 |
| Independent channel and event model | ADR-0021 |
| Optional Redis-based horizontal scaling | ADR-0008, ADR-0013, ADR-0014, ADR-0015, ADR-0016 |

## Suggested next review

Start with the new and rewritten decisions: ADR-0009 and ADR-0018 through ADR-0021. They contain the design items (message names, token format, algorithms, endpoint contracts) that are intentionally undecided. Then review ADR-0005, ADR-0007, and ADR-0014 through ADR-0016.
