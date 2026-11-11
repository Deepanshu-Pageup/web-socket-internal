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
| `WS_PATH` | no | `/ws` | WebSocket upgrade path. Must start with `/`; cannot be `/health` or `/ready`. |
| `WS_MAX_PAYLOAD_BYTES` | no | `65536` | Max inbound frame size (1–16777216). Larger frames close the connection with 1009. |
| `WS_PING_INTERVAL_MS` | no | `30000` | Ping interval (10–300000). A connection with no pong by the next interval is terminated. |
| `WS_MAX_CONNECTIONS` | no | `10000` | Max concurrent connections (including in-flight upgrades). Excess upgrades get 503. |
| `WS_MAX_BUFFERED_BYTES` | no | `1048576` | Max outbound buffered bytes per connection. Exceeding it closes the client with 1008. Keep it at least as large as the largest message the server will send. |

No credential variables exist yet. Client-token verification and publisher
credentials are design items in ADR-0020 and ADR-0009; variables will be added
only after those designs are approved.

## Endpoints (Phase 02 skeleton)

- `GET /health` — process is alive (200).
- `GET /ready` — 200 when listening, 503 before startup completes and during shutdown.

## WebSocket transport (Phase 03)

`WS_PATH` accepts standard WebSocket upgrades. The transport validates path,
method, `Origin` and capacity only; there is no application protocol,
authentication or channel logic yet, and inbound frames are ignored.

- `ALLOWED_ORIGINS` empty: origin checking is disabled (a warning is logged at
  startup). Non-empty: the `Origin` header must match exactly, and requests
  without one are rejected with 403.
- Until an authentication design is approved (ADR-0020), any upgrade that passes
  these checks is accepted. Do not expose this build to untrusted networks.
- Per-message compression is disabled.

No publishing or statistics endpoints exist yet.
