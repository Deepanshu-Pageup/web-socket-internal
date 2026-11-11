# Product Specification --- Internal Realtime Server

**Document type:** Product and implementation specification\
**Project:** Internal Realtime Server\
**Version:** 2.0 (independent architecture)\
**Status:** Architecture baseline under re-review (see ADR-0004)\
**Audience:** AI coding assistants, backend engineers, infrastructure
engineers, reviewers

> **Design-item convention.** Message names, token formats, cryptographic
> algorithms, endpoint paths, and error codes are **not finalized** in this
> document. Anything marked **[DESIGN]** is a design item that requires
> review and approval (Phase 01 ADRs) before it may be treated as a
> contract or implemented.

------------------------------------------------------------------------

## 1. Product Overview

Build a reusable, self-hosted, independent real-time messaging system for
internal company projects. The system consists of:

-   a WebSocket server that speaks the project's **own versioned
    application protocol**,
-   a **first-party TypeScript client SDK**, and
-   a **versioned HTTP publishing API** for consuming backends.

The company maintains one shared source codebase. Each project that
needs real-time communication independently deploys its own instance of
the server alongside its backend, preferably through Docker. The server
provides a common real-time capability without requiring each project to
implement WebSocket transport, connection handling, channel
subscriptions, or event broadcasting itself.

The project owns the complete real-time stack: protocol, authentication
model, client SDK, publishing API, and channel/event conventions. It does
not implement the protocol of, or depend on the client or server SDKs of,
any third-party realtime service (see ADR-0004 for the historical
decision).

The server must remain a generic infrastructure component. It must not
contain project-specific business logic.

### Product statement

> A versioned, reusable, self-hosted real-time system --- server,
> protocol, client SDK, and publishing API --- that company projects can
> independently deploy and integrate with.

## 2. Goals

The product should:

1.  Accept WebSocket connections from first-party SDK clients using
    standard WebSocket transport.
2.  Define and implement its own versioned WebSocket application
    protocol (message envelopes, event types, errors, subscription
    lifecycle).
3.  Manage connection lifecycles and server-assigned connection
    identifiers.
4.  Support channel subscription and unsubscription.
5.  Support public and private channels (confirmed requirements);
    support presence channels only if a real requirement is established.
6.  Authenticate trusted server-side publishers.
7.  Validate short-lived, scoped connection tokens issued by consuming
    backends, and authorize private-channel subscriptions independently
    of any third-party scheme.
8.  Publish server-triggered events over a versioned HTTP API.
9.  Broadcast events to all eligible local subscribers.
10. Handle heartbeats, disconnects, reconnections, cleanup, payload
    limits, and backpressure.
11. Provide a first-party TypeScript client SDK that manages connection
    lifecycle, reconnection, heartbeat, subscriptions, and event
    handling.
12. Expose basic health and operational statistics.
13. Run independently per project using a versioned Docker image.
14. Keep an architectural path open for optional multi-instance scaling.

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
-   Compatible with the protocol, client SDKs, or server SDKs of any
    third-party realtime service.
-   A requirement to implement Redis, PostgreSQL, Kubernetes, or a
    management dashboard in the first release.

Each deployment is isolated. A project owns its deployment
configuration, credentials, connections, channels, and runtime state.

## 4. Confirmed Technology and Architecture Decisions

  -----------------------------------------------------------------------
  Area                                Decision
  ----------------------------------- -----------------------------------
  Runtime                             Node.js 24 LTS

  Language                            TypeScript (strict mode)

  Package manager                     npm

  Dependency lock                     `package-lock.json`

  WebSocket transport                 `ws` library (standard WebSocket)

  HTTP server                         Node.js `node:http`

  WebSocket upgrade                   Explicit upgrade handling; evaluate
                                      `ws` `noServer` mode

  Cryptography                        Node.js `node:crypto`

  Validation                          Zod

  Logging                             Pino

  Testing                             Vitest

  Containerization                    Docker

  Local orchestration                 Docker Compose

  Application protocol                Own versioned protocol (details
                                      **[DESIGN]**, ADR-0018)

  Client                              First-party TypeScript SDK
                                      (ADR-0019)

  Client authentication               Backend-issued short-lived scoped
                                      connection tokens (ADR-0020,
                                      details **[DESIGN]**)

  Publishing                          Own versioned HTTP API (ADR-0009,
                                      details **[DESIGN]**)

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
design and implement the application protocol, authentication model,
and messaging behavior.

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
  Frontend (client SDK)         Frontend (client SDK)
  Realtime server A              Realtime server B
```

The deployments do not share connections, channels, presence,
credentials, or runtime state.

### 5.2 Project integration responsibilities

Each consuming project is responsible for:

-   Supplying its deployment-specific server configuration and
    credentials.
-   Authenticating its own users.
-   Issuing short-lived connection tokens to its authenticated users,
    scoped to what those users may access.
-   Deciding whether a user may subscribe to a private channel.
-   Publishing business events after its own business operation
    succeeds.
-   Handling client reconnection and resubscription (the SDK assists).
-   Treating WebSocket events as real-time notifications, not as the
    authoritative business database.

The realtime server is responsible for:

-   Verifying server-side publishing requests.
-   Validating connection tokens and private-channel authorization.
-   Managing WebSocket connections and subscriptions.
-   Routing and delivering events.
-   Managing presence if enabled.
-   Enforcing transport and resource limits.

Never expose a long-lived server secret to browser or mobile clients.
Clients receive only short-lived, scoped tokens.

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

The transport layer must not contain protocol or channel business logic.

### 6.2 Protocol layer

Responsibilities:

-   Parse and validate incoming protocol messages.
-   Serialize outgoing protocol messages.
-   Define the protocol version and version negotiation behavior.
-   Define message envelopes and event types.
-   Handle connection-established and connection-error messages.
-   Handle subscribe and unsubscribe messages and their
    success/failure responses.
-   Handle application-level heartbeat behavior if required.
-   Return protocol errors using a defined error model.

The protocol's versioning scheme, envelope fields, message names, and
error codes are **[DESIGN]** items owned by this project (ADR-0018).
They must not be invented ad hoc in code: they are specified, reviewed,
and covered by protocol compatibility tests first.

### 6.3 Connection manager

Responsibilities:

-   Assign and track server-generated connection IDs.
-   Register and unregister active connections.
-   Associate connections with their deployment context and validated
    token claims.
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
-   Support excluding a connection from delivery only if a real
    requirement is established.
-   Handle slow clients and bounded outbound queues.
-   Record delivery-related metrics without logging sensitive payloads.

### 6.6 Authentication and authorization

Responsibilities:

-   Validate connection tokens issued by the consuming backend (format,
    signature/verification scheme, expiry, and scope are **[DESIGN]**,
    ADR-0020).
-   Authorize private-channel subscriptions according to token scope or
    backend-issued grants (**[DESIGN]**, ADR-0020).
-   Validate presence-related claims if presence is in scope.
-   Validate trusted backend publishing credentials.
-   Apply allowed-origin policy.
-   Enforce rate and payload limits.
-   Avoid leaking secrets or tokens in errors or logs.

The consuming project's backend remains responsible for user identity
and business permission decisions.

### 6.7 Presence manager

**Optional.** Implement only if a real requirement for presence channels
is established and approved.

Potential responsibilities:

-   Track user membership in presence channels.
-   Handle member-joined and member-left notifications.
-   Return the current member set as required.
-   Handle one user with multiple simultaneous connections.
-   Clean up membership after disconnects.
-   Avoid removing a user while another connection for that user remains
    active.

Presence in a multi-instance deployment requires shared membership
coordination; local memory or Redis Pub/Sub alone is not sufficient.

### 6.8 Publishing API

Provide a versioned server-to-server HTTP API owned by this project.

Expected capabilities (details **[DESIGN]**, ADR-0009):

-   Publish an event to one channel.
-   Publish to multiple channels only if a requirement is established.
-   Authenticate backend publishers using deployment-specific server
    credentials or cryptographic request signatures.
-   Replay protection (for example timestamp window and/or nonce;
    mechanism **[DESIGN]**).
-   Validate event names, channels, and payloads.
-   Enforce request and payload limits.
-   Return a defined, consistent error model.

Do not finalize endpoint paths, request signing algorithm, or response
bodies until the publishing API design is reviewed and approved.

### 6.9 First-party client SDK

A TypeScript SDK maintained in this repository (ADR-0019).

Responsibilities:

-   Connection lifecycle management.
-   Reconnection with backoff, and fresh token acquisition on reconnect.
-   Heartbeat handling.
-   Subscription management, including resubscription after reconnect.
-   Event handling API for application code.

The SDK's **public API** must be kept separate from the **internal
protocol implementation** so the wire protocol can evolve without
breaking SDK consumers, subject to the compatibility and versioning
policy (**[DESIGN]**). The SDK obtains tokens by calling a
consumer-supplied function; it never holds a long-lived server secret.

### 6.10 Operational endpoints

Initial operational endpoints may include:

-   `GET /health`
-   `GET /ready`
-   `GET /internal/stats`

Keep operational endpoints protected or restricted to an appropriate
internal network. They must not expose secrets or sensitive connection
data.

## 7. Core Workflows

Steps below describe responsibilities and order. Concrete message names
and payload shapes are **[DESIGN]** items.

### 7.1 Client connection workflow

1.  The consuming frontend obtains a short-lived connection token from
    its own backend, using the project's existing authentication.
2.  The SDK connects to the project's configured WebSocket endpoint,
    declaring a protocol version and presenting the token (delivery
    mechanism **[DESIGN]**; avoid placing credentials where they are
    routinely logged).
3.  The server validates the request, token, origin policy, and protocol
    version.
4.  The WebSocket connection is accepted.
5.  The server assigns a connection ID.
6.  The server sends the protocol's connection-established message.
7.  The connection is registered in the local connection manager.
8.  The client may request channel subscriptions.

### 7.2 Public channel subscription workflow

1.  The client sends a subscribe message for a public channel.
2.  The protocol layer validates the message.
3.  The channel manager creates or finds the channel.
4.  The subscription manager adds the connection.
5.  The server sends the subscription-success message.
6.  Future events published to that channel are delivered to the
    connection.

### 7.3 Private channel authorization workflow

1.  The client requests a private channel subscription.
2.  Authorization evidence is obtained from the consuming backend,
    which validates the user's identity and business permissions. The
    evidence is either channel scope embedded in the connection token or
    a short-lived grant issued for that channel (**[DESIGN]**,
    ADR-0020).
3.  The client sends the subscription request with that evidence.
4.  The realtime server independently validates the evidence (integrity,
    expiry, deployment, channel, and connection binding as designed).
5.  If valid, the subscription manager adds the connection.
6.  If invalid, the server rejects the subscription with a protocol
    error.

The realtime server must never trust unverified authorization evidence.

### 7.4 Presence channel workflow

Only implement this workflow if a presence requirement is established.

1.  The backend determines permitted presence identity and metadata and
    conveys it as verifiable claims.
2.  The realtime server verifies the claims.
3.  The connection joins the channel and receives current presence
    state.
4.  Member-joined/member-left notifications are emitted according to
    membership changes.
5.  Disconnect cleanup removes a member only when that user no longer
    has an active connection in the channel.

### 7.5 Server-side event publishing workflow

1.  A project backend completes and commits its business operation.
2.  The backend creates a real-time event with a channel, event name,
    and payload.
3.  The backend sends an authenticated HTTP publishing request to its
    own realtime server deployment.
4.  The publishing API authenticates, applies replay protection, and
    validates the request.
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
6.  The SDK reconnects using its configured backoff policy.
7.  The SDK obtains a fresh connection token (and any needed
    private-channel authorization).
8.  The SDK resubscribes to its channels.

Do not promise durable or exactly-once delivery. A client may miss
events while disconnected. Applications must reconcile important state
with their backend.

### 7.7 Independent deployment workflow

1.  The server team builds and tests the shared source.
2.  A release produces a versioned Docker image.
3.  A consuming project pins the desired image version.
4.  The project supplies its own environment configuration and secrets
    at deployment time.
5.  The project starts its realtime container alongside its backend.
6.  Its frontend connects to the project's reachable WebSocket endpoint.
7.  Its backend publishes events to that same deployment.
8.  The project can upgrade or roll back independently.

Do not use an unpinned `latest` image for controlled production
deployment.

## 8. Scope by Release

### Release 1 --- Single-instance system

Expected scope:

-   WebSocket transport using `ws`.
-   Own versioned application protocol.
-   Connection lifecycle and connection IDs.
-   Public channels.
-   Private channels with backend-issued authorization.
-   Backend-issued short-lived connection tokens.
-   Server-triggered events via the versioned HTTP publishing API.
-   First-party TypeScript client SDK.
-   Heartbeats and disconnect cleanup.
-   Payload limits and backpressure.
-   Basic health/readiness and statistics.
-   Docker image and independent project deployment.
-   Automated unit, protocol, integration, and security tests.

Presence, client-originated events, multi-channel publishing, webhooks,
and other extras must be included only when a requirement is
established and approved.

### Later optional capabilities

-   Presence channels if not required in the first release.
-   Client-originated events.
-   Webhook delivery.
-   Event batching and multi-channel publishing.
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

-   Keep long-lived server secrets server-side only; clients receive only
    short-lived, scoped tokens.
-   Never log secrets, tokens, authorization evidence, signatures, or
    sensitive payloads.
-   Verify publisher request authentication and apply replay protection.
-   Validate connection tokens (integrity, expiry, scope).
-   Verify private-channel authorization.
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
-   Token and authorization validation.
-   Publisher authentication and replay protection.
-   Presence membership if enabled.
-   Configuration validation.

### Protocol compatibility tests

-   Valid and invalid messages for each supported protocol version.
-   Connection-established behavior.
-   Subscribe/unsubscribe responses.
-   Error responses.
-   Heartbeat and ping/pong behavior.
-   Protocol-version negotiation and rejection.
-   Compatibility between supported server and SDK versions.

### Integration tests

-   Multiple clients on one channel.
-   Multiple channels per connection.
-   Private authorization success/failure.
-   Event broadcast.
-   Disconnect cleanup.
-   Reconnect and resubscribe via the client SDK.
-   Backend publishing API.

### Security and resilience tests

-   Invalid, expired, and tampered tokens.
-   Unauthorized subscriptions.
-   Replayed publishing requests.
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
-   Authentication and authorization failures.
-   Message sizes.
-   Outbound queue pressure.
-   Event delivery latency where measurable.
-   Process memory and CPU.

Logs should be structured and useful for operations while avoiding
secrets, tokens, and sensitive payloads.

## 13. Implementation Roadmap and Approval Gates

### Phase 00 --- Requirements Discovery

Establish real requirements: consuming projects, channel types, event
and payload conventions, authentication flows, workload, and
operational expectations. Includes an inventory of existing legacy
realtime integrations that must be migrated.

**Deliverable:** Requirements and migration inventory.

**Gate:** Minimum required feature set agreed.

### Phase 01 --- Architecture and ADR Approval

Finalize module boundaries, protocol design scope, token and
authorization model, publishing API design, SDK architecture,
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

### Phase 04 --- Application Protocol

Specify and implement the versioned application protocol: versioning,
envelopes, connection establishment, heartbeat, subscription lifecycle,
event delivery, errors, reconnection behavior, and protocol
compatibility tests.

**Deliverable:** Protocol specification and tested protocol layer.

### Phase 05 --- Channel and Event System

Implement subscription management, channel behavior, and event
broadcasting.

**Deliverable:** Functional single-node messaging.

### Phase 06 --- Authentication and Presence

Implement connection-token validation, private-channel authorization,
publisher authentication, and presence if a requirement is established.

**Deliverable:** Secure channel access and required membership behavior.

### Phase 07 --- Publishing API

Implement and test the versioned server-side publishing API.

**Deliverable:** Backend publishing integration.

### Phase 08 --- Client SDK, Integration, Reliability, and Performance

Implement the first-party TypeScript client SDK, integrate a real
company project, and validate security, reconnects, backpressure, and
measured capacity.

**Deliverable:** Client SDK, integration report, and performance report.

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
3.  Do not add features merely because other realtime systems offer
    them; include a feature only when a requirement is established.
4.  Do not invent protocol behavior, message names, token formats,
    cryptographic algorithms, or endpoint contracts. They are design
    items that require review and approval before implementation.
5.  Do not implement compatibility with, or depend on the client or
    server SDKs of, any third-party realtime service.
6.  Do not start implementation while Phase 00 discovery or Phase 01
    architecture approval is incomplete.
7.  Work only on the currently approved phase and its stated scope.
8.  Do not silently expand scope or begin a later phase.
9.  Do not introduce a dependency, database, broker, framework, or
    infrastructure service without explaining why it is needed.
10. Use npm, not pnpm.
11. Keep TypeScript strict and tests alongside the relevant modules.
12. Keep transport, protocol, channel logic, authorization, publishing,
    client SDK, and infrastructure responsibilities separated. Keep SDK
    public APIs separate from internal protocol implementation.
13. Preserve independent per-project deployment and isolation.
14. Do not add SaaS concepts, tenant provisioning, workspaces, billing,
    or centralized user registration.
15. Do not expose long-lived server secrets to clients.
16. Do not claim tests, compatibility, performance, or deployment have
    succeeded unless actually verified.
17. Before a major implementation phase, present its plan, affected
    files/modules, dependencies, risks, and acceptance criteria for
    approval.
18. After implementation, report changed files, tests run, results,
    known limitations, and any decisions that need review.
19. Never provision paid hosting, databases, Redis services, domains,
    monitoring, or other paid infrastructure without explicit approval.

## 15. Requirements and Design Questions That Must Be Answered

The following are unresolved and must be answered from company evidence
or architecture review:

-   Which company projects will consume the system first?
-   Which legacy realtime integrations must be migrated, and in what
    order?
-   Which channel types are actually needed?
-   Are client-originated events needed?
-   Is presence needed?
-   Are webhooks or subscription-count notifications needed?
-   What are the approximate concurrent connections and event rates?
-   What are typical and maximum payload sizes?
-   Are mobile/background connections required?
-   What are the project's availability and recovery expectations?
-   What network and TLS constraints exist in the deployment
    environment?
-   **[DESIGN]** Protocol versioning scheme, message envelope, event
    types, and error model.
-   **[DESIGN]** Connection token format, verification scheme (symmetric
    vs asymmetric), lifetime, scope model, and token delivery mechanism.
-   **[DESIGN]** Private-channel authorization model (token-embedded
    scope vs per-channel grants).
-   **[DESIGN]** Publishing API endpoints, authentication scheme, replay
    protection, limits, and error model.
-   **[DESIGN]** Channel naming conventions and event envelope.
-   **[DESIGN]** Credential rotation approach.
-   **[DESIGN]** SDK packaging, distribution, and compatibility policy.

Do not finalize these until they have evidence-based answers and review.

------------------------------------------------------------------------

## 16. Definition of Product Success

The initial product is successful when:

1.  At least one real company project can independently deploy the
    versioned Docker image.
2.  Its frontend, using the first-party SDK, connects with a
    backend-issued token and receives events.
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
independent real-time system that satisfies verified company
requirements. Own the protocol, SDK, and authentication model. Keep
every deployment independent, keep business logic in consuming
applications, and introduce distributed infrastructure only when actual
requirements justify it.
