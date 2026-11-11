# Internal Realtime Server — Roadmap

This folder tracks the discovery, architecture, implementation, verification, and deployment of the company's self-hosted Pusher-compatible WebSocket server.

## Project principles

- One shared source repository and versioned Docker image.
- Independent deployment alongside each company project.
- Pusher Channels compatibility based on verified existing usage.
- Node.js 24 LTS, TypeScript, npm, `ws`, and Vitest.
- Start with one instance and in-memory state.
- Redis and horizontal scaling are optional future capabilities.
- No coding before requirements discovery and architecture approval.
- No paid services or infrastructure without explicit approval.

## How to use this roadmap

1. Complete phases in order unless a dependency is explicitly documented.
2. Do not mark a phase complete until its exit criteria are met.
3. Record technical decisions in `docs/adr/` in the main repository.
4. Keep discovered requirements and compatibility evidence in project documentation.
5. Obtain approval before beginning each major implementation phase.

## Phase index

| Phase | Name | Status |
|---|---|---|
| 00 | Requirements Discovery | Complete |
| 01 | Architecture & ADR Approval | Complete |
| 02 | Project Foundation | Not started |
| 03 | WebSocket Transport | Not started |
| 04 | Pusher Protocol Compatibility | Not started |
| 05 | Channel & Event System | Not started |
| 06 | Authentication & Presence | Not started |
| 07 | Server-side Publishing API | Not started |
| 08 | Integration, Reliability & Performance | Not started |
| 09 | Docker Distribution & Deployment | Not started |
| 10 | Optional Horizontal Scaling | Deferred |

See each phase file for scope, dependencies, deliverables, and exit criteria.
