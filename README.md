# Internal Realtime Server

Self-hosted, independent realtime system: a WebSocket server with its own
versioned protocol, a first-party TypeScript client SDK, and a versioned HTTP
publishing API. See `roadmap/` for the phased plan and `docs/` for architecture
and ADRs. Current state: Phase 03 (WebSocket transport) in progress; no
application protocol or publishing functionality yet.

## Layout

- `backend/` — the server: source, tests, `package.json`, Dockerfile and Compose file.
- `frontend/` — reserved for the client side (empty; nothing implemented).
- `docs/`, `roadmap/`, `.agents/` — architecture, ADRs, roadmap and project rules.

## Requirements

Node.js 24 LTS and npm. Docker is optional for the container build.

## Commands

Run these from `backend/`:

```bash
cd backend
npm ci                 # reproducible install
npm run typecheck      # strict TypeScript check
npm run lint
npm run format:check
npm test
npm run build          # outputs dist/
npm start              # runs dist/main.js (needs environment variables)
npm run dev            # watch mode via tsx
```

## Run locally

From `backend/`, copy `.env.example` to `.env`, set placeholder values, then:

```bash
docker compose up --build
```

Configuration is documented in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).
