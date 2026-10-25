> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# List raw events, including each event's full payload.

> Cursor-paginated: read a page, then pass its `next_cursor` back as `cursor`.
`next_cursor` is null on the final page. For the dashboard's lighter feed
without payloads, use `/events/summary`.



## OpenAPI

````yaml /reference/openapi.json get /events
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
    get:
      tags:
        - Events
      summary: List raw events, including each event's full payload.
      description: >-
        Cursor-paginated: read a page, then pass its `next_cursor` back as
        `cursor`.

        `next_cursor` is null on the final page. For the dashboard's lighter
        feed

        without payloads, use `/events/summary`.
      operationId: list_events
      parameters:
        - name: session_id
          in: query
          description: Comma-separated session ids.
          required: false
          schema:
            type: string
        - name: agent_id
          in: query
          description: Comma-separated agent ids.
          required: false
          schema:
            type: string
        - name: event_type
          in: query
          description: Comma-separated event types.
          required: false
          schema:
            type: string
        - name: environment
          in: query
          description: Comma-separated environments.
          required: false
          schema:
            type: string
        - name: ts_from
          in: query
          description: RFC 3339 lower bound (inclusive).
          required: false
          schema:
            type: string
        - name: ts_to
          in: query
          description: RFC 3339 upper bound (exclusive).
          required: false
          schema:
            type: string
        - name: order
          in: query
          description: '`desc` (default) or `asc`.'
          required: false
          schema:
            type: string
        - name: cursor
          in: query
          description: Opaque cursor from the previous page.
          required: false
          schema:
            type: string
        - name: limit
          in: query
          description: Default 50, capped at 1000.
          required: false
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: A page of events plus `next_cursor`.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `events:read`.
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