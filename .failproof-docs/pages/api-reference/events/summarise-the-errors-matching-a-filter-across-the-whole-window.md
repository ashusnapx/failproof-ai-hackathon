> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Summarise the errors matching a filter, across the whole window.

> Returns `total`, the number of distinct `sessions` and `agents` involved,
`last_ts` (null when nothing matched), a `bins` array of exactly 24 counts,
and the `bounds` in epoch milliseconds that those bins span.

Two things to know. The result is ALWAYS restricted to errored events, so it
is not a general event rollup — the same filters here and on
`/events/summary?errored=true` describe the same set, which is what keeps a
chart and its rows in agreement. And when `ts_from`/`ts_to` are omitted, the
bins span the matched data's own first and last event rather than a fixed
window, so `bounds` is the only reliable way to turn a bin index back into a
time range. Counts are computed over the entire window, not the current page,
and are cached for about ten seconds.



## OpenAPI

````yaml /reference/openapi.json get /events/error_summary
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
  /events/error_summary:
    get:
      tags:
        - Events
      summary: Summarise the errors matching a filter, across the whole window.
      description: >-
        Returns `total`, the number of distinct `sessions` and `agents`
        involved,

        `last_ts` (null when nothing matched), a `bins` array of exactly 24
        counts,

        and the `bounds` in epoch milliseconds that those bins span.


        Two things to know. The result is ALWAYS restricted to errored events,
        so it

        is not a general event rollup — the same filters here and on

        `/events/summary?errored=true` describe the same set, which is what
        keeps a

        chart and its rows in agreement. And when `ts_from`/`ts_to` are omitted,
        the

        bins span the matched data's own first and last event rather than a
        fixed

        window, so `bounds` is the only reliable way to turn a bin index back
        into a

        time range. Counts are computed over the entire window, not the current
        page,

        and are cached for about ten seconds.
      operationId: list_error_summary
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
        - name: error_type
          in: query
          description: Comma-separated error types.
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
          description: RFC 3339 lower bound (inclusive). Also the histogram's start.
          required: false
          schema:
            type: string
        - name: ts_to
          in: query
          description: RFC 3339 upper bound (inclusive). Also the histogram's end.
          required: false
          schema:
            type: string
        - name: search
          in: query
          description: >-
            Free-text match against the event payload. Repeat the parameter to
            match any of several terms.
          required: false
          schema:
            type: string
        - name: search_exclude
          in: query
          description: >-
            Comma-separated payload keys the free-text search should ignore,
            e.g. `agent_id,environment`.
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Error totals, a 24-bin histogram, and the bounds it spans.
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