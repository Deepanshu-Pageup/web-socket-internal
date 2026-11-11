# Phase-gated change workflow

Use this workflow for every proposed product change.

## 1. Establish the gate

1. Read `CLAUDE.md`, `.agents/rules/project.md`, the roadmap, the product
   specification, and the relevant phase document.
2. Check the current phase status and its entry/exit criteria.
3. Inspect the relevant repository files and existing changes.
4. If the task would implement functionality while Phase 00 is incomplete or
   Phase 01 is unapproved, do not implement it. Identify the missing evidence
   or approval and propose an in-scope discovery/documentation step.

## 2. Confirm scope and acceptance

For work permitted by the current phase, identify:

- Evidence or requirement supporting the change.
- In-scope deliverables and explicit exclusions.
- Files/modules expected to change.
- Dependencies and architecture/security risks.
- Tests or other evidence required for acceptance.

For a major implementation phase, present this information and obtain approval
before editing. Do not treat a request to perform one task as approval for
unrelated work or a later phase.

## 3. Make and verify the change

1. Make a focused change using existing project patterns.
2. Update directly related documentation and tests.
3. Run the smallest relevant verification commands.
4. If verification fails, investigate and fix only failures caused by the
   change; clearly report unrelated baseline failures.
5. Do not change phase status or mark an approval gate complete without the
   documented evidence and review.

## 4. Report

Summarize:

- What changed and where.
- Tests/checks run and exact outcomes.
- Any limitations or unverified behavior.
- Open decisions, missing evidence, and approvals needed before the next phase.

Never report unrun checks as passed or imply broader compatibility than the
verified scope.
