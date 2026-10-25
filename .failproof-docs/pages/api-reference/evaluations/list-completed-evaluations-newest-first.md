> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# List completed evaluations, newest first.

> Cursor-paginated: read a page, then pass its `next_cursor` back as `cursor`.
`next_cursor` is null on the final page. Every filter below AND-composes.

`latest_per_session=true` collapses the page to one row per session — that
session's most recent evaluation — which is what the sessions list shows.
Without it you get the full evaluation history, so a re-evaluated session
appears more than once.



## OpenAPI

````yaml /reference/openapi.json get /evaluations
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
  /evaluations:
    get:
      tags:
        - Evaluations
      summary: List completed evaluations, newest first.
      description: >-
        Cursor-paginated: read a page, then pass its `next_cursor` back as
        `cursor`.

        `next_cursor` is null on the final page. Every filter below
        AND-composes.


        `latest_per_session=true` collapses the page to one row per session —
        that

        session's most recent evaluation — which is what the sessions list
        shows.

        Without it you get the full evaluation history, so a re-evaluated
        session

        appears more than once.
      operationId: list_evaluations
      parameters:
        - name: session_id
          in: query
          description: Exact session id.
          required: false
          schema:
            type: string
        - name: agent_id
          in: query
          description: Exact agent id.
          required: false
          schema:
            type: string
        - name: environment
          in: query
          description: Comma-separated environments.
          required: false
          schema:
            type: string
        - name: status
          in: query
          description: One of `done`, `error`, `timeout`. Anything else is a 400.
          required: false
          schema:
            type: string
        - name: ts_from
          in: query
          description: RFC 3339 lower bound on `completed_at` (inclusive).
          required: false
          schema:
            type: string
        - name: ts_to
          in: query
          description: RFC 3339 upper bound on `completed_at` (inclusive).
          required: false
          schema:
            type: string
        - name: cursor
          in: query
          description: Opaque cursor from the previous page.
          required: false
          schema:
            type: integer
            format: int64
        - name: limit
          in: query
          description: Default 50, capped at 200 — asking for more silently gets you 200.
          required: false
          schema:
            type: integer
            format: int64
        - name: score_filters
          in: query
          description: >-
            Comma-separated `key:min..max` ranges over the top-level numeric
            `scores` keys. Either bound may be omitted: `factuality:0.9..`,
            `cost:..0.3`. At most 20 entries; more is a 400. Entries that do not
            parse are dropped silently.
          required: false
          schema:
            type: string
        - name: metric_filters
          in: query
          description: >-
            Same grammar and 20-entry cap as `score_filters`, but matched
            against the nested magnitude metrics at `scores.metrics.<key>`
            (cost, latency, tokens).
          required: false
          schema:
            type: string
        - name: latest_per_session
          in: query
          description: Return only the most recent evaluation per session. Default false.
          required: false
          schema:
            type: boolean
      responses:
        '200':
          description: A page of evaluations plus `next_cursor`.
        '400':
          description: >-
            Unknown `status`, or more than 20 `score_filters` / `metric_filters`
            entries.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `evaluations:read`.
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