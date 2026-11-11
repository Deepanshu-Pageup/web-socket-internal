# Phase 00 — Requirements Discovery

**Status:** Complete  
**Type:** Discovery; no implementation

**Completion record (2026-11-11):** Marked complete on the project owner's
instruction, stating they reviewed the work. The investigation checklist below
and the Phase 00 deliverables were not verified in the repository when this
status was recorded. Link the reviewed evidence here.

**Revision note (2026-11-11):** The project adopted an independent protocol,
SDK, authentication model, and publishing API (ADR-0004). The objective,
checklist, and deliverables below were rewritten accordingly; the former
third-party compatibility deliverables are superseded. The completion record
above predates this revision and has not been re-reviewed. The project owner
must decide whether Phase 00 status stands (see unresolved decisions in the
architecture report).

## Objective

Establish the real requirements for the independent real-time system: which
projects consume it, which channels and events they need, how their users are
authenticated, expected workload, and which legacy realtime integrations must
be migrated.

## Required inputs

- Frontend code that currently receives real-time updates (legacy integrations).
- Backend code that currently publishes real-time events.
- How each project authenticates users and authorizes access to data.
- Sanitized channel names and event payload examples.
- Approximate concurrent connections, event rates, and payload sizes.
- Deployment/network constraints and downtime expectations.

Never provide production secrets, access tokens, private keys, or credentials. Replace them with placeholders.

## Investigation checklist

- [ ] Inventory every company project that needs real-time communication.
- [ ] Inventory existing legacy realtime integrations that must be migrated.
- [ ] Identify public-channel needs.
- [ ] Identify private-channel needs and the backend's authorization rules.
- [ ] Confirm whether presence is actually needed.
- [ ] Confirm whether client-originated events are needed.
- [ ] Inventory event names and payload conventions.
- [ ] Inspect how each backend authenticates users (input to the connection-token design).
- [ ] Inspect server-side publishing patterns in each backend.
- [ ] Identify mobile/background connection requirements.
- [ ] Estimate connection and message workload.
- [ ] Record availability and recovery expectations.

## Deliverables

- Project and legacy-integration inventory.
- Requirements specification (minimum feature scope).
- Migration notes per consuming project.
- Initial workload and operational requirements.

## Exit criteria

Phase 00 is complete when actual application needs are evidenced and the minimum feature scope is agreed. Do not infer feature requirements from other realtime systems' feature catalogues.
