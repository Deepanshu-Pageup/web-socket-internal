# Internal Realtime Server — Roadmap

This folder tracks the discovery, architecture, implementation, verification, and deployment of the company's self-hosted, independent real-time system: a WebSocket server with its own versioned protocol, a first-party TypeScript client SDK, and a versioned HTTP publishing API.

## Project principles

- One shared source repository and versioned Docker image.
- Independent deployment alongside each company project.
- Own versioned application protocol, client SDK, authentication model, publishing API, and channel/event conventions. No third-party realtime protocol or SDK dependency (ADR-0004).
- Node.js 24 LTS, TypeScript (strict), npm, `ws`, and Vitest.
- Start with one instance and in-memory state.
- Redis and horizontal scaling are optional future capabilities.
- No coding before requirements discovery and architecture approval.
- No paid services or infrastructure without explicit approval.

## How to use this roadmap

1. Complete phases in order unless a dependency is explicitly documented.
2. Do not mark a phase complete until its exit criteria are met.
3. Record technical decisions in `docs/adr/` in the main repository.
4. Keep discovered requirements and design evidence in project documentation.
5. Obtain approval before beginning each major implementation phase.

## Phase index

| Phase | Name | Status |
|---|---|---|
| 00 | Requirements Discovery | Complete |
| 01 | Architecture & ADR Approval | Complete |
| 02 | Project Foundation | Not started |
| 03 | WebSocket Transport | Not started |
| 04 | Application Protocol | Not started |
| 05 | Channel & Event System | Not started |
| 06 | Authentication & Presence | Not started |
| 07 | Server-side Publishing API | Not started |
| 08 | Client SDK, Integration, Reliability & Performance | Not started |
| 09 | Docker Distribution & Deployment | Not started |
| 10 | Optional Horizontal Scaling | Deferred |

Phase 00 and 01 statuses are unchanged by the independent-architecture revision (ADR-0004), but their completion records predate it. See the revision notes in those phase files; re-review is an open decision.

See each phase file for scope, dependencies, deliverables, and exit criteria.
