> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# List one alert's issues.

> The same rows as `GET /issues`, restricted to this alert. The default
`state` differs: this returns the alert's full history —
`firing,acknowledged,resolved` — because it backs the per-alert page rather
than the board. An `alert_id` in the query string is ignored; the path wins.



## OpenAPI

````yaml /reference/openapi.json get /alerts/{id}/issues
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
  /alerts/{id}/issues:
    get:
      tags:
        - Issues
      summary: List one alert's issues.
      description: >-
        The same rows as `GET /issues`, restricted to this alert. The default

        `state` differs: this returns the alert's full history —

        `firing,acknowledged,resolved` — because it backs the per-alert page
        rather

        than the board. An `alert_id` in the query string is ignored; the path
        wins.
      operationId: list_incidents_for_alert
      parameters:
        - name: id
          in: path
          description: The alert's id.
          required: true
          schema:
            type: string
            format: uuid
        - name: state
          in: query
          description: >-
            Comma-separated states from `firing`, `acknowledged`, `resolved`.
            Default: all three.
          required: false
          schema:
            type: string
        - name: limit
          in: query
          description: Default 200, capped at 1000.
          required: false
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: The alert's issues, newest first.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `issues:read`.
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