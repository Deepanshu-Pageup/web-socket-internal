# Internal Realtime Server

Self-hosted, Pusher Channels-compatible realtime server. See `roadmap/` for the
phased plan and `docs/` for architecture and ADRs. Current state: Phase 02
project foundation only; no WebSocket or Pusher functionality yet.

## Requirements

Node.js 24 LTS and npm. Docker is optional for the container build.

## Commands

```bash
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

Copy `.env.example` to `.env`, set placeholder values, then:

```bash
docker compose up --build
```

Configuration is documented in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).
