# Phase 02 — Project Foundation

**Status:** Not started  
**Depends on:** Phase 01 approval

## Objective

Create a reproducible npm-based Node.js and TypeScript project foundation.

## Scope

- Initialize Node.js 24 LTS and TypeScript project.
- Use npm and commit `package-lock.json`.
- Configure strict TypeScript.
- Configure Vitest.
- Configure linting and formatting.
- Add validated environment configuration.
- Add structured logging.
- Establish Docker build and local Compose foundation.
- Add basic health/readiness skeleton only as approved by architecture.

## Deliverables

- Reproducible npm installation.
- Build, test, lint, and development scripts.
- Docker image builds locally.
- Documented environment variables.

## Exit criteria

A clean checkout can run `npm ci`, build, test, and build/start the container reproducibly.
