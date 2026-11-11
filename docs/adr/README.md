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

| ADR | Title | Initial status |
|---|---|---|
| ADR-0001 | Node.js and TypeScript Runtime | Accepted |\n| ADR-0002 | npm Package Management | Accepted |\n| ADR-0003 | WebSocket Transport Using ws | Accepted |\n| ADR-0004 | Pusher Channels Protocol Compatibility | Accepted |\n| ADR-0005 | Modular Monolith Architecture | Proposed |\n| ADR-0006 | Independent Project Deployments | Accepted |\n| ADR-0007 | In-Memory Initial State Management | Proposed |\n| ADR-0008 | Redis for Optional Distributed Messaging | Accepted direction |\n| ADR-0009 | Pusher-Compatible HTTP Publishing API | Proposed |\n| ADR-0010 | No Database in Initial Deployment | Accepted direction |\n| ADR-0011 | Shared Source and Versioned Docker Distribution | Accepted |\n| ADR-0012 | Single-Node Default Deployment | Accepted |\n| ADR-0013 | Optional Horizontal Scaling | Accepted |\n| ADR-0014 | Redis Pub/Sub Adapter | Proposed |\n| ADR-0015 | Load Balancer and Connection Routing | Proposed |\n| ADR-0016 | Distributed Presence Coordination | Proposed |\n| ADR-0017 | Versioned Docker Image Releases | Accepted |\n
## Suggested next review

Start with ADR-0005, ADR-0007, ADR-0009, and ADR-0014 through ADR-0016. These contain the most important unresolved architecture details. Also validate ADR-0004 against actual company Pusher usage before treating compatibility scope as final.
