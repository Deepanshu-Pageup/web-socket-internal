# Environment variables

Configuration is read from the environment and validated at startup with Zod.
On invalid input the process exits with code 1 and names the invalid variables
only; values are never printed. Use placeholders in examples; never commit real
credentials. Variable names are the Phase 02 foundation set and may change during
later phases.

| Variable | Required | Default | Description |
|---|---|---|---|
| `HOST` | no | `0.0.0.0` | Interface to bind. |
| `PORT` | no | `6001` | TCP port (1–65535). |
| `LOG_LEVEL` | no | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`. |
| `ALLOWED_ORIGINS` | no | empty | Comma-separated origin list. Parsed now; enforced in a later phase. |
| `SHUTDOWN_TIMEOUT_MS` | no | `10000` | Max time to wait for graceful shutdown (0–120000). |

No credential variables exist yet. Client-token verification and publisher
credentials are design items in ADR-0020 and ADR-0009; variables will be added
only after those designs are approved.

## Endpoints (Phase 02 skeleton)

- `GET /health` — process is alive (200).
- `GET /ready` — 200 when listening, 503 before startup completes and during shutdown.

No WebSocket, publishing, or statistics endpoints exist yet.
