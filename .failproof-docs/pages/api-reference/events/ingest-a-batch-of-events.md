> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Ingest a batch of events.

> The body is newline-delimited JSON — one event object per line, not a JSON
array. Malformed lines are SKIPPED, not rejected: the response reports
`accepted` and `skipped` counts and the status is 200 even when every line
was bad. A 5xx means "retry the whole batch"; duplicate events are collapsed
server-side, so retrying is safe.



## OpenAPI

````yaml /reference/openapi.json post /events
openapi: 3.1.0
info:
  title: AgentEye API
  description: >-
    The AgentEye observability API.


    Every path below is relative to `/v1` on your deployment's dashboard origin
    — e.g. `https://app.example.com/v1/sessions`. Authenticate with a scoped API
    key as a bearer token.


    Organization scoping: a key belongs to one organization and acts on it
    automatically. An instance-scoped key selects one per request with the
    `X-AgentEye-Org` header; without it, such a key resolves to the default
    organization, so set it explicitly on a multi-org deployment.
  license:
    name: MIT
    identifier: MIT
  version: 0.0.1-beta.77
servers:
  - url: https://app.befailproof.ai/v1
    description: Failproof AI Cloud
security:
  - api_key: []
tags:
  - name: Events
    description: Ingest and query the event store.
  - name: Sessions
    description: Agent sessions and their evaluations.
  - name: Evaluations
    description: Evaluation results and re-runs.
  - name: Dashboards
    description: Dashboards and their tiles.
  - name: Queries
    description: Saved SQL and ad-hoc query execution.
  - name: Keys
    description: Mint and manage scoped API keys.
  - name: Users
    description: Dashboard members and access.
  - name: Settings
    description: Operational settings and context-window overrides.
  - name: Permission sets
    description: Named permission roles.
  - name: Alerts
    description: Alert rules and their recipients.
  - name: Issues
    description: Open, triage, assign and resolve issues.
  - name: Audits
    description: Recurring audits and their findings.
  - name: Usage
    description: Organization usage and billing windows.
  - name: Health
    description: Liveness.
  - name: Auth
    description: Describe the key you are calling with.
paths:
  /events:
    post:
      tags:
        - Events
      summary: Ingest a batch of events.
      description: >-
        The body is newline-delimited JSON — one event object per line, not a
        JSON

        array. Malformed lines are SKIPPED, not rejected: the response reports

        `accepted` and `skipped` counts and the status is 200 even when every
        line

        was bad. A 5xx means "retry the whole batch"; duplicate events are
        collapsed

        server-side, so retrying is safe.
      operationId: handler
      requestBody:
        description: One JSON event object per line.
        content:
          application/x-ndjson:
            schema:
              type: string
        required: true
      responses:
        '200':
          description: Batch processed. Reports `accepted` and `skipped` counts.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `events:add`.
        '500':
          description: Storage write failed — retry the batch.
      security:
        - api_key: []
components:
  securitySchemes:
    api_key:
      type: http
      scheme: bearer
      description: >-
        A scoped AgentEye API key. Mint one in the dashboard under Settings →
        API keys, or with `POST /v1/keys`. Each endpoint names the permission it
        requires; a key without it gets 403 and a `required_permission` field
        naming what was missing.

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.