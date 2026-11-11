# Strict project rules for Claude

These rules govern repository exploration, documentation, design, and code
changes. They supplement `CLAUDE.md` and the canonical product and roadmap
documents; they do not grant approval to bypass roadmap gates.

## 1. Phase gate

The current documented state is:

- Phase 00 — Requirements Discovery: **In progress**
- Phase 01 — Architecture & ADR Approval: **Not started**
- Phases 02–09: **Not started**
- Phase 10 — Optional Horizontal Scaling: **Deferred**

Until the roadmap and phase documents are updated with evidence that Phase 00
exit criteria are met and Phase 01 architecture/ADRs are approved:

- Do not implement product code or begin a later phase.
- Do not create a prototype that would effectively implement a deferred feature.
- Limit project work to approved discovery, evidence-backed requirements,
  architecture/ADR preparation, and administrative documentation.
- A request to code is not itself proof that the phase gate has passed. Explain
  the missing gate and offer an in-scope next step instead.

Do not mark a phase complete, alter its status, or record a decision as accepted
without the required evidence and review/approval.

## 2. Scope and evidence

- Treat the product specification, roadmap, phase scope, and approved ADRs as
  the source of truth. Resolve conflicts explicitly; do not silently choose a
  convenient interpretation.
- Base compatibility requirements on actual company integrations, SDK
  versions, protocol evidence, and tests. Pusher feature availability alone is
  not evidence that a feature is required.
- Do not finalize behavior for unresolved discovery questions. Record the
  question and evidence needed.
- Do not silently expand the current phase, begin a later phase, or introduce
  business logic owned by consuming applications.
- Keep this product a generic infrastructure component. Exclude centralized
  identity, tenant/workspace provisioning, billing, and project-specific
  business behavior.

## 3. Architecture constraints

Unless changed through an approved architecture review, preserve:

- Node.js 24 LTS and strict TypeScript.
- npm and `package-lock.json`; do not use pnpm.
- `ws` for WebSocket transport and Node `node:http` for HTTP.
- Node `node:crypto`, Zod, Pino, Vitest, Docker, and Docker Compose.
- Explicit WebSocket upgrade handling; evaluate `ws` `noServer` mode rather
  than introducing another transport framework.
- A single-instance, in-memory initial deployment, independently deployed per
  consuming project.
- No mandatory database, Redis, broker, Kubernetes, or management dashboard in
  the initial release.
- Horizontal scaling and distributed presence only when a verified requirement
  justifies them and the associated design is approved.

Do not add, replace, or materially change dependencies, storage, network
services, frameworks, or deployment architecture without explaining the need
and obtaining the required review.

Keep transport, Pusher protocol, connection lifecycle, channel/subscription
logic, event dispatch, authorization, publishing API, and operational concerns
in distinct responsibilities. The server must not own or mutate consuming
applications' business records.

## 4. Coding standards

- Use kebab-case for new file and directory names, including TypeScript source,
  test, and documentation files (for example, `connection-manager.ts` and
  `connection-manager.test.ts`). Follow an existing ecosystem-mandated naming
  convention only when the tool or framework requires it; do not rename
  unrelated existing files.
- Use TypeScript for application and test code. Keep strict compiler settings
  enabled; do not weaken TypeScript configuration to make a change compile.
- Never introduce the `any` type, including explicit `any`, `any[]`,
  `Array<any>`, or `as any`.
- Do not allow implicit `any`; add precise types to parameters, return values,
  callbacks, and data boundaries as needed. Use `unknown` for untrusted or
  not-yet-narrowed values, then validate or narrow them before use.
- Prefer existing domain types, generics, discriminated unions, and runtime
  validation (including the approved Zod baseline) over unsafe casts. Avoid
  `as unknown as ...` or equivalent casts that bypass type checking.
- Keep types accurate at external boundaries such as WebSocket messages,
  environment configuration, HTTP requests, and JSON payloads. Validate
  untrusted data before treating it as a domain type.
- Run the repository's type-check/build after TypeScript changes and resolve
  type errors rather than suppressing them with `any`, broad casts, or disabled
  compiler checks.

## 5. Security and reliability

- Keep application secrets server-side. Never put secrets in frontend code,
  examples, fixtures, logs, or committed configuration.
- Do not request or reproduce production secrets. Use placeholders and
  sanitized evidence.
- Verify publisher signatures/timestamps and protected-channel authorization
  signatures as required by the approved compatibility scope.
- Validate origins, channel/event names, payloads, and resource limits.
- Restrict operational endpoints; do not expose secrets or sensitive
  connection-level data.
- Prevent cross-deployment and cross-channel leakage.
- Bound outbound buffers and handle slow clients; clean up connections and
  subscriptions on disconnect and shutdown.
- Do not promise durable or exactly-once event delivery. Clients must reconcile
  important state with the consuming backend.
- Do not suppress errors, return success-shaped fallbacks, or claim security
  properties that have not been tested.

## 6. Change discipline

Before editing:

1. Inspect the relevant source, tests, docs, and current project state.
2. Identify the approved phase, exact scope, acceptance criteria, and any
   missing evidence or decisions.
3. For major implementation work, present the plan, affected modules,
   dependencies, risks, and acceptance criteria and obtain approval before
   proceeding.

When editing:

- Make the smallest complete change that meets the approved scope.
- Follow existing patterns and preserve unrelated user changes.
- Keep TypeScript strict and add focused tests alongside relevant modules once
  implementation is authorized.
- Update directly related documentation.
- Never change roadmap status or approval records as a side effect of coding.

After editing:

- Run the smallest relevant tests, lint, type-check, or build command available.
- State exactly what was run and its result. Distinguish not-run from passed.
- Report changed files, remaining limitations, and decisions/approvals needed.
- Do not claim compatibility, performance, deployment, or test success without
  direct verification.

## 7. Read-only Git usage

- Git is for inspection only. Allowed examples include `git status`,
  `git diff`, `git log`, `git show`, `git branch --list`, and read-only
  repository queries.
- Never run a Git command that changes working-tree files, the index, refs, or
  repository state. This includes `add`, `commit`, `checkout`, `switch`,
  `reset`, `clean`, `restore`, `stash`, `merge`, `rebase`, `cherry-pick`,
  `pull`, `fetch`, `am`, and `apply`.
- Do not use Git to discard, overwrite, stage, or commit user changes. Make
  requested file edits directly and preserve unrelated changes.

## 8. Infrastructure and cost

Never provision or enable paid hosting, databases, Redis services, domains,
monitoring, or other paid infrastructure without explicit approval. Prefer
local/free verification. Do not add optional infrastructure merely to
anticipate future scaling.
