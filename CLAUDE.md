# Claude project instructions

These instructions apply to every task in this repository.

## Required context

Before making a change, read:

1. `.agents/rules/project.md`
2. `roadmap/README.md`
3. `roadmap/ROADMAP.md`
4. `roadmap/Internal-Realtime-Server-Product-Specification.md`
5. The relevant phase document in `roadmap/phases/`
6. Relevant architecture and ADR documents, if present

Follow `.agents/workflows/phase-gated-change.md` for implementation work.
The product specification and approved ADRs are authoritative. If instructions
conflict or a required approval/evidence is missing, stop before implementation
and report the blocker.

## Non-negotiable project constraints

- The roadmap currently marks Phase 00 as **In progress** and Phase 01 as **Not
  started**. Do not implement product functionality until Phase 00 is complete
  and Phase 01 architecture/ADRs are reviewed and approved.
- Work only within the currently approved phase. Do not infer approval from a
  user request, a roadmap deliverable, or an unfinished implementation.
- Do not broaden Pusher compatibility beyond evidenced company usage.
- Preserve the approved baseline: Node.js 24 LTS, TypeScript, npm,
  `package-lock.json`, `ws`, Node `http`, `node:crypto`, Zod, Pino, Vitest,
  Docker, and Docker Compose. Do not substitute pnpm, Socket.IO, or a custom
  WebSocket transport without explicit architecture review.
- Preserve independent per-project deployments, in-memory initial state, and
  the single-instance default. Do not add SaaS/tenant features, a database,
  Redis, or other infrastructure without a documented requirement and approval.
- Follow the coding standards in `.agents/rules/project.md`: use kebab-case for
  file and directory names, maintain strict TypeScript, and never introduce
  explicit or implicit `any`.
- Never expose application secrets to clients or log secrets, authorization
  signatures, or sensitive payloads. Never use real credentials in examples;
  use placeholders.
- Do not provision or incur charges for paid infrastructure or services
  without explicit approval.

## Execution and reporting

- Inspect the existing files and working-tree state before editing; preserve
  unrelated user changes.
- Use Git commands only to inspect repository state or history. Never use a Git
  command that changes files, the index, refs, or repository state.
- Keep transport, protocol, connections, channels, authorization, publishing,
  and infrastructure responsibilities separated.
- Do not invent protocol behavior. Verify it against official protocol
  documentation and compatibility tests.
- Make focused changes, add/update relevant tests and documentation, and run
  the smallest applicable verification command.
- Report changed files, commands actually run and their results, limitations,
  and decisions or approvals still needed. Never claim unverified success.
