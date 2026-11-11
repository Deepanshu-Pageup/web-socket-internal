# Product Specification --- Internal Realtime Server

**Document type:** Product and implementation specification\
**Project:** Internal Realtime Server\
**Version:** 1.0\
**Status:** Discovery / architecture baseline\
**Audience:** AI coding assistants, backend engineers, infrastructure
engineers, reviewers

------------------------------------------------------------------------

## 1. Product Overview

Build a reusable, self-hosted, Pusher Channels-compatible real-time
messaging server for internal company projects.

The company maintains one shared source codebase. Each project that
needs real-time communication independently deploys its own instance of
the server alongside its backend, preferably through Docker. The server
provides a common real-time capability without requiring each project to
implement WebSocket transport, connection handling, channel
subscriptions, or event broadcasting itself.

The server must remain a generic infrastructure component. It must not
contain project-specific business logic.

### Product statement

> A versioned, reusable WebSocket server that company projects can
> independently deploy and integrate with using existing Pusher Channels
> client patterns wherever practical.

## 2. Goals

The product should:

1.  Accept WebSocket connections from supported clients.
2.  implement the required subset of the Pusher Channels protocol, based
    on verified company usage.
3.  Manage connection lifecycles and socket identifiers.
4.  Support channel subscription and unsubscription.
5.  Support public and private channels; support presence channels if
    discovery confirms they are needed.
6.  Authenticate trusted server-side publishers.
7.  Authorize private and presence channel subscriptions using
    Pusher-compatible signatures where required.
8.  Publish server-triggered events over an HTTP API.
9.  Broadcast events to all eligible local subscribers.
10. Handle heartbeats, disconnects, reconnections, cleanup, payload
    limits, and backpressure.
11. Expose basic health and operational statistics.
12. Run independently per project using a versioned Docker image.
13. Keep an architectural path open for optional multi-instance scaling.

## 3. Non-Goals

The initial product is not:

-   A public SaaS platform.
-   A centralized multi-tenant service.
-   A workspace, tenant, billing, or subscription management system.
-   A user registration or identity provider.
-   A replacement for each project's business backend.
-   A durable message queue or event store.
-   A general-purpose workflow engine.
-   A Socket.IO server.
-   A requirement to reproduce every Pusher Channels feature.
-   A requirement to implement Redis, PostgreSQL, Kubernetes, or a
    management dashboard in the first release.

Each deployment is isolated. A project owns its application
configuration, credentials, connections, channels, and runtime state.

## 4. Confirmed Technology and Architecture Decisions

  -----------------------------------------------------------------------
  Area                                Decision
  ----------------------------------- -----------------------------------
  Runtime                             Node.js 24 LTS

  Language                            TypeScript

  Package manager                     npm

  Dependency lock                     `package-lock.json`

  WebSocket transport                 `ws` library

  HTTP server                         Node.js `node:http`

  WebSocket upgrade                   Explicit upgrade handling; evaluate
                                      `ws` `noServer` mode

  Cryptography                        Node.js `node:crypto`

  Validation                          Zod

  Logging                             Pino

  Testing                             Vitest

  Containerization                    Docker

  Local orchestration                 Docker Compose

  Client compatibility                Prioritize existing Pusher Channels
                                      clients

  Deployment                          Independent deployment per project

  Distribution                        Versioned Docker image

  Initial state                       In-memory

  Initial database                    None unless discovery proves
                                      persistence is required

  Initial Redis                       None for single-instance
                                      deployments

  Scaling                             Optional horizontal scaling,
                                      introduced when justified
  -----------------------------------------------------------------------

Do not substitute pnpm, Socket.IO, or a custom low-level WebSocket
implementation without an explicit architecture review.

The `ws` library handles WebSocket transport. The project itself must
implement the required Pusher application protocol and messaging
behavior.

## 5. Deployment and Consumption Model

### 5.1 Shared source, independent deployments

There is one maintained source repository and release pipeline. It
produces versioned Docker images, for example:

`company/internal-realtime-server:1.0.0`

Each project selects and deploys a version independently.

Example topology:

``` text
Company source repository
        |
        v
Versioned Docker image
        |
        +--------------------------+
        |                          |
        v                          v
Project A deployment          Project B deployment
  Backend                       Backend
  Frontend                      Frontend
  Realtime server A              Realtime server B
```

The deployments do not share connections, channels, presence,
credentials, or runtime state.

### 5.2 Project integration responsibilities

Each consuming project is responsible for:

-   Supplying its deployment-specific server configuration and secret.
-   Authenticating its own users.
-   Deciding whether a user may subscribe to a protected channel.
-   Publishing business events after its own business operation
    succeeds.
-   Handling client reconnection and resubscription.
-   Treating WebSocket events as real-time notifications, not as the
    authoritative business database.

The realtime server is responsible for:

-   Verifying server-side publishing requests.
-   Verifying channel authorization signatures.
-   Managing WebSocket connections and subscriptions.
-   Routing and delivering events.
-   Managing presence if enabled.
-   Enforcing transport and resource limits.

Never expose an application secret to browser or mobile clients.

## 6. Main System Components

### 6.1 Transport layer

Responsibilities:

-   HTTP server integration.
-   WebSocket upgrade handling.
-   WebSocket connection lifecycle.
-   Ping/pong and heartbeat handling.
-   Close handling.
-   Message/frame size limits.
-   Backpressure and slow-client handling.
-   Graceful shutdown.

The transport layer must not contain Pusher channel business logic.

### 6.2 Pusher protocol layer

Responsibilities:

-   Parse and validate incoming Pusher protocol messages.
-   Serialize Pusher-compatible outgoing messages.
-   Handle connection-established and connection-error events.
-   Handle subscribe and unsubscribe protocol messages.
-   Handle subscription success and failure responses.
-   Handle required protocol ping/pong behavior.
-   Return protocol-compatible errors.

Target Pusher protocol version 7 as the initial investigation target,
but verify actual SDK versions and protocol behavior used by company
applications before locking compatibility.

### 6.3 Connection manager

Responsibilities:

-   Assign and track socket IDs.
-   Register and unregister active connections.
-   Associate connections with their deployment/application context.
-   Track connection state.
-   Clean up subscriptions on disconnect.
-   Support safe shutdown and reconnection behavior.

### 6.4 Channel and subscription manager

Responsibilities:

-   Maintain channel membership.
-   Support subscribe and unsubscribe operations.
-   Track the relationship between connections and channels.
-   Enforce channel-type rules.
-   Remove empty channel records when appropriate.
-   Prevent cross-channel or cross-deployment message leakage.

One connection may subscribe to multiple channels. One channel may have
multiple connections.

### 6.5 Event dispatcher

Responsibilities:

-   Accept validated events from the publishing API or permitted
    protocol flows.
-   Find eligible local subscribers.
-   Deliver events to the correct connections.
-   Respect excluded-socket behavior if required by compatibility.
-   Handle slow clients and bounded outbound queues.
-   Record delivery-related metrics without logging sensitive payloads.

### 6.6 Authorization

Responsibilities:

-   Validate trusted backend publishing credentials.
-   Validate private-channel authorization signatures.
-   Validate presence authorization signatures and user data if presence
    is in scope.
-   Apply allowed-origin policy.
-   Enforce rate and payload limits.
-   Avoid leaking secrets in errors or logs.

The consuming project's backend remains responsible for user identity
and business permission decisions.

### 6.7 Presence manager

Implement only if discovery confirms presence-channel usage.

Potential responsibilities:

-   Track user membership in presence channels.
-   Handle member-added and member-removed notifications.
-   Return the current member set as required by the protocol.
-   Handle one user with multiple simultaneous connections.
-   Clean up membership after disconnects.
-   Avoid removing a user while another connection for that user remains
    active.

Presence in a multi-instance deployment requires shared membership
coordination; local memory or Redis Pub/Sub alone is not sufficient.

### 6.8 Publishing API

Provide a server-to-server HTTP API compatible with the required subset
of Pusher's publishing API.

Investigate and implement only the endpoints and signing conventions
needed by existing backend SDKs or a migration adapter.

Expected capabilities may include:

-   Publish an event to one channel.
-   Publish to multiple channels if required.
-   Validate signed requests.
-   Validate event names, channels, and payloads.
-   Enforce request and payload limits.
-   Return compatible success and error responses.

Do not finalize endpoint details until existing backend usage has been
inspected.

### 6.9 Operational endpoints

Initial operational endpoints may include:

-   `GET /health`
-   `GET /ready`
-   `GET /internal/stats`

Keep operational endpoints protected or restricted to an appropriate
internal network. They must not expose secrets or sensitive connection
data.

## 7. Core Workflows

### 7.1 Client connection workflow

1.  A client connects to the project's configured WebSocket endpoint
    using the application key and supported Pusher protocol parameters.
2.  The server validates the request, application configuration, origin
    policy, and protocol requirements.
3.  The WebSocket connection is accepted.
4.  The server assigns a socket ID.
5.  The server sends the Pusher-compatible connection-established event.
6.  The connection is registered in the local connection manager.
7.  The client may request channel subscriptions.

### 7.2 Public channel subscription workflow

1.  The client sends a Pusher subscribe message for a public channel.
2.  The protocol layer validates the message.
3.  The channel manager creates or finds the channel.
4.  The subscription manager adds the connection.
5.  The server sends the required subscription-success event.
6.  Future events published to that channel are delivered to the
    connection.

### 7.3 Private channel authorization workflow

1.  The client requests a private channel subscription.
2.  The client obtains authorization from the consuming project's
    backend using the project's existing authentication.
3.  The project backend validates the user's identity and business
    permissions.
4.  The backend generates the required Pusher-compatible authorization
    signature.
5.  The client sends the subscription request and authorization response
    to the realtime server.
6.  The realtime server independently validates the signature.
7.  If valid, the subscription manager adds the connection.
8.  If invalid, the server rejects the subscription with the appropriate
    protocol error.

The realtime server must never trust an unsigned or unverified
authorization response.

### 7.4 Presence channel workflow

Only implement this workflow if presence usage is confirmed.

1.  The client requests presence-channel authorization from the project
    backend.
2.  The backend validates the user and determines permitted presence
    metadata.
3.  The backend returns a correctly signed authorization response and
    user data.
4.  The realtime server verifies the signature and user data.
5.  The connection joins the channel.
6.  The server sends the required subscription-success and presence
    state.
7.  Member-added/member-removed events are emitted according to
    membership changes.
8.  Disconnect cleanup removes a member only when that user no longer
    has an active connection in the channel.

### 7.5 Server-side event publishing workflow

1.  A project backend completes and commits its business operation.
2.  The backend creates a real-time event with a channel, event name,
    and payload.
3.  The backend sends an authenticated HTTP publishing request to its
    own realtime server deployment.
4.  The publishing API authenticates and validates the request.
5.  The event dispatcher finds local subscribers.
6.  The server sends the event to eligible connected clients.
7.  Clients update their UI or fetch authoritative data from the project
    backend when needed.

Publishing should happen after the relevant business operation succeeds.
The realtime server must not own or mutate project business records.

### 7.6 Disconnect and reconnect workflow

1.  A connection closes normally, times out, or is lost.
2.  The server detects the close or failed heartbeat.
3.  The connection manager unregisters the connection.
4.  All local channel subscriptions are removed.
5.  Presence membership is updated if enabled.
6.  The client reconnects using its configured retry policy.
7.  The client obtains fresh authorization where required.
8.  The client resubscribes to its channels.

Do not promise durable or exactly-once delivery. A client may miss
events while disconnected. Applications must reconcile important state
with their backend.

### 7.7 Independent deployment workflow

1.  The server team builds and tests the shared source.
2.  A release produces a versioned Docker image.
3.  A consuming project pins the desired image version.
4.  The project supplies its own environment configuration and secret at
    deployment time.
5.  The project starts its realtime container alongside its backend.
6.  Its frontend connects to the project's reachable WebSocket endpoint.
7.  Its backend publishes events to that same deployment.
8.  The project can upgrade or roll back independently.

Do not use an unpinned `latest` image for controlled production
deployment.

## 8. Scope by Release

### Release 1 --- Single-instance replacement

Expected scope, subject to discovery:

-   WebSocket transport using `ws`.
-   Required Pusher protocol compatibility.
-   Connection lifecycle and socket IDs.
-   Public channels.
-   Private channels and authorization if used.
-   Server-triggered events.
-   HTTP publishing API for required backend usage.
-   Heartbeats and disconnect cleanup.
-   Payload limits and backpressure.
-   Basic health/readiness and statistics.
-   Docker image and independent project deployment.
-   Automated unit, protocol, integration, and security tests.

Presence, client events, multi-channel publishing, webhooks, and other
Pusher features must be included only when confirmed by discovery.

### Later optional capabilities

-   Presence channels if not required in the first release.
-   Client events.
-   Webhook delivery.
-   Event batching and multi-channel publishing.
-   Cache or encrypted channels.
-   Redis-based inter-instance messaging.
-   Distributed presence coordination.
-   Multi-instance load balancing.
-   Durable event storage/replay if a real requirement emerges.

## 9. Scaling Strategy

### 9.1 Initial single-node deployment

-   One realtime server process per project deployment.
-   In-memory connection and subscription state.
-   No Redis.
-   No PostgreSQL.
-   No shared state with other project deployments.

### 9.2 Optional horizontal scaling

Introduce multiple instances only when measured workload or availability
requirements justify it.

A scaled deployment may require:

-   Multiple WebSocket instances.
-   A load balancer that supports long-lived WebSocket connections.
-   Redis Pub/Sub or another broker for inter-instance event
    distribution.
-   Shared membership coordination for presence if enabled.
-   Connection ownership and cleanup strategy.
-   Reconnection and failure-recovery behavior.
-   Cross-instance integration and load tests.

Redis Pub/Sub is not durable. It does not replay messages missed while a
subscriber is disconnected. Do not treat it as a guaranteed-delivery
queue.

Do not add Redis or paid infrastructure without explicit approval.

### 9.3 Capacity validation

Do not claim a fixed connection capacity without benchmarks.

Measure at least:

-   Concurrent connections.
-   Messages per second.
-   Payload size distribution.
-   Delivery latency.
-   Memory per connection.
-   CPU utilization.
-   Outbound queue/backpressure behavior.
-   Reconnect behavior during instance restart.

Test with realistic workload profiles on documented hardware.

## 10. Security Requirements

-   Keep application secrets server-side only.
-   Never log secrets, authorization signatures, or sensitive payloads.
-   Verify publisher request signatures and timestamps.
-   Verify private/presence channel authorization signatures.
-   Validate allowed origins.
-   Enforce maximum connection and message sizes.
-   Apply appropriate rate limits.
-   Bound outbound buffers and handle slow clients.
-   Validate channel names and event names.
-   Prevent cross-deployment and cross-channel message leakage.
-   Restrict operational endpoints.
-   Use TLS in production.
-   Handle shutdown without leaving stale local state.

## 11. Quality and Testing Requirements

### Unit tests

-   Connection registry.
-   Channel registry.
-   Subscription operations.
-   Event routing.
-   Signature validation.
-   Presence membership if enabled.
-   Configuration validation.

### Protocol tests

-   Valid and invalid Pusher messages.
-   Connection-established behavior.
-   Subscribe/unsubscribe responses.
-   Error responses.
-   Required ping/pong behavior.
-   Protocol-version compatibility.

### Integration tests

-   Multiple clients on one channel.
-   Multiple channels per connection.
-   Private authorization success/failure.
-   Event broadcast.
-   Disconnect cleanup.
-   Reconnect and resubscribe.
-   Backend publishing API.
-   Existing Pusher SDK compatibility.

### Security and resilience tests

-   Invalid signatures.
-   Unauthorized subscriptions.
-   Origin rejection.
-   Oversized messages.
-   Rate limiting.
-   Slow consumers and backpressure.
-   Unexpected disconnects.
-   Graceful shutdown.
-   No cross-project or cross-channel leakage.

### Scaling tests, when applicable

-   Event delivery across instances.
-   Instance failure and reconnection.
-   Presence coordination.
-   Redis outage behavior.
-   Load-balancer WebSocket forwarding.

## 12. Observability

Initial metrics should include:

-   Active connections.
-   Connection opens and closes.
-   Active channels.
-   Subscription successes and failures.
-   Published events.
-   Delivered events.
-   Rejected publishing requests.
-   Authorization failures.
-   Message sizes.
-   Outbound queue pressure.
-   Event delivery latency where measurable.
-   Process memory and CPU.

Logs should be structured and useful for operations while avoiding
secrets and sensitive payloads.

## 13. Implementation Roadmap and Approval Gates

### Phase 00 --- Requirements Discovery

Inspect actual company Pusher integrations, SDK versions, channel types,
events, authorization, publishing, and workload.

**Deliverable:** Pusher usage inventory and compatibility specification.

**Gate:** Minimum required feature set agreed.

### Phase 01 --- Architecture and ADR Approval

Finalize module boundaries, protocol scope, security, publishing API,
deployment, and architecture decision records.

**Deliverable:** Architecture documentation and approved ADRs.

**Gate:** Architecture approved before implementation.

### Phase 02 --- Project Foundation

Create the npm-based Node.js/TypeScript project, tests, configuration,
logging, and Docker build foundation.

**Deliverable:** Reproducible project foundation.

### Phase 03 --- WebSocket Transport

Implement and test the `ws` transport, upgrade handling, lifecycle,
heartbeat, limits, and shutdown.

**Deliverable:** Tested transport layer.

### Phase 04 --- Pusher Protocol

Implement the required Pusher wire protocol messages and compatibility
tests.

**Deliverable:** Compatible connection and protocol layer.

### Phase 05 --- Channel and Event System

Implement subscription management, channel behavior, and event
broadcasting.

**Deliverable:** Functional single-node messaging.

### Phase 06 --- Authentication and Presence

Implement required publisher and channel authorization, plus presence if
confirmed.

**Deliverable:** Secure channel access and required membership behavior.

### Phase 07 --- Publishing API

Implement and test the required server-side publishing API.

**Deliverable:** Backend publishing integration.

### Phase 08 --- Integration, Reliability, and Performance

Integrate a real company project and validate security, reconnects,
backpressure, and measured capacity.

**Deliverable:** Integration and performance report.

### Phase 09 --- Docker Distribution and Deployment

Publish a versioned image and document project-level deployment,
configuration, upgrade, and rollback.

**Deliverable:** Independently deployable release.

### Phase 10 --- Optional Horizontal Scaling

Add multi-instance routing and shared messaging only when justified.

**Deliverable:** Tested scaled deployment profile.

## 14. AI Implementation Instructions

Any AI coding assistant working on this project must follow these rules:

1.  Read this specification and the current architecture/ADR documents
    before proposing code changes.
2.  Inspect the existing repository before creating or modifying files.
3.  Do not assume Pusher features are required merely because Pusher
    supports them.
4.  Do not invent protocol behavior. Use the official Pusher protocol
    documentation and compatibility tests.
5.  Do not start implementation while Phase 00 discovery or Phase 01
    architecture approval is incomplete.
6.  Work only on the currently approved phase and its stated scope.
7.  Do not silently expand scope or begin a later phase.
8.  Do not introduce a dependency, database, broker, framework, or
    infrastructure service without explaining why it is needed.
9.  Use npm, not pnpm.
10. Keep TypeScript strict and tests alongside the relevant modules.
11. Keep transport, Pusher protocol, channel logic, authorization,
    publishing, and infrastructure responsibilities separated.
12. Preserve independent per-project deployment and isolation.
13. Do not add SaaS concepts, tenant provisioning, workspaces, billing,
    or centralized user registration.
14. Do not expose application secrets to clients.
15. Do not claim tests, compatibility, performance, or deployment have
    succeeded unless actually verified.
16. Before a major implementation phase, present its plan, affected
    files/modules, dependencies, risks, and acceptance criteria for
    approval.
17. After implementation, report changed files, tests run, results,
    known limitations, and any decisions that need review.
18. Never provision paid hosting, databases, Redis services, domains,
    monitoring, or other paid infrastructure without explicit approval.

## 15. Discovery Questions That Must Be Answered

The following are unresolved and must be answered from company evidence:

-   Which company projects currently use Pusher?
-   Which frontend Pusher SDKs and versions are installed?
-   Which backend Pusher SDKs and versions are installed?
-   Which channel types are actually used?
-   Are client events used?
-   Are presence channels used?
-   Are webhooks or subscription-count events used?
-   Which Pusher HTTP publishing operations are used?
-   What authorization endpoints and response formats exist?
-   What are the approximate concurrent connections and event rates?
-   What are typical and maximum payload sizes?
-   Are mobile/background connections required?
-   What are the project's availability and recovery expectations?
-   What network and TLS constraints exist in the deployment
    environment?

Do not finalize compatibility scope until these questions have
evidence-based answers.

------------------------------------------------------------------------

## 16. Definition of Product Success

The initial product is successful when:

1.  At least one real company project can independently deploy the
    versioned Docker image.
2.  Its existing Pusher client integration works for the agreed feature
    subset, or an approved migration adapter is available.
3.  Its backend can authenticate and publish events.
4.  Authorized clients receive events from their subscribed channels.
5.  Unauthorized clients cannot subscribe to protected channels.
6.  Connections, subscriptions, and resources are cleaned up correctly.
7.  The server can be restarted and clients can reconnect and
    resubscribe.
8.  Tests verify the supported protocol and messaging behavior.
9.  Deployment, configuration, upgrade, and rollback are documented.
10. No unapproved paid infrastructure is required.

**Final product principle:** Build the smallest secure and reliable
Pusher-compatible real-time service that satisfies verified company
usage. Keep every deployment independent, keep business logic in
consuming applications, and introduce distributed infrastructure only
when actual requirements justify it.
