> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Roll up the latency between two event types into a chart-ready summary.

> Pairs each `start_event_type` event with its matching `end_event_type` event
and reports the duration between them: `bins` (a time series over the
window), `heatmap` (time against latency band), `summary` (pair count with
p50/p95/p99 and max), `events` (window totals), and, when
`distribution_key_paths` is given, a `distribution` broken down by that key.
This is how the tools, models and hooks pages are drawn.

`start_event_type` and `end_event_type` are required and must differ;
anything else returns 400. `ts_to` defaults to now, and omitting `ts_from`
spans back to the oldest matching event rather than a fixed window — check
`bounds` in the response for what was actually covered. `bin_count` defaults
to 24 and is clamped to 1–168. The distribution names the top 10 keys and
rolls the rest into a single `(other)` entry, so it still sums to the window
total.

Two behaviours worth knowing. `payload_sum_paths` can only sum `duration_ms`,
`input_tokens` and `output_tokens` — any other path is ignored silently and
its `sums` entry stays 0. And sums count only the closing event of each pair,
so token usage reported on both legs is not double-counted.



## OpenAPI

````yaml /reference/openapi.json get /events/latency_aggregate
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
  /events/latency_aggregate:
    get:
      tags:
        - Events
      summary: Roll up the latency between two event types into a chart-ready summary.
      description: >-
        Pairs each `start_event_type` event with its matching `end_event_type`
        event

        and reports the duration between them: `bins` (a time series over the

        window), `heatmap` (time against latency band), `summary` (pair count
        with

        p50/p95/p99 and max), `events` (window totals), and, when

        `distribution_key_paths` is given, a `distribution` broken down by that
        key.

        This is how the tools, models and hooks pages are drawn.


        `start_event_type` and `end_event_type` are required and must differ;

        anything else returns 400. `ts_to` defaults to now, and omitting
        `ts_from`

        spans back to the oldest matching event rather than a fixed window —
        check

        `bounds` in the response for what was actually covered. `bin_count`
        defaults

        to 24 and is clamped to 1–168. The distribution names the top 10 keys
        and

        rolls the rest into a single `(other)` entry, so it still sums to the
        window

        total.


        Two behaviours worth knowing. `payload_sum_paths` can only sum
        `duration_ms`,

        `input_tokens` and `output_tokens` — any other path is ignored silently
        and

        its `sums` entry stays 0. And sums count only the closing event of each
        pair,

        so token usage reported on both legs is not double-counted.
      operationId: latency_aggregate
      parameters:
        - name: start_event_type
          in: query
          description: Required. The event type that opens a span, e.g. `tool_use`.
          required: true
          schema:
            type: string
        - name: end_event_type
          in: query
          description: >-
            Required. The event type that closes it, e.g. `tool_result`. Must
            differ from `start_event_type`.
          required: true
          schema:
            type: string
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
        - name: environment
          in: query
          description: Comma-separated environments.
          required: false
          schema:
            type: string
        - name: ts_from
          in: query
          description: >-
            RFC 3339 lower bound. Omit to span back to the oldest matching
            event.
          required: false
          schema:
            type: string
        - name: ts_to
          in: query
          description: RFC 3339 upper bound. Defaults to now.
          required: false
          schema:
            type: string
        - name: bin_count
          in: query
          description: Time bins on the X axis. Default 24, clamped to 1–168.
          required: false
          schema:
            type: integer
            format: int64
        - name: outcome
          in: query
          description: >-
            `success`, `error`, or `all` (the default, and the fallback for an
            unrecognized value).
          required: false
          schema:
            type: string
        - name: model
          in: query
          description: Comma-separated exact model names. Applies to both legs of a pair.
          required: false
          schema:
            type: string
        - name: tool_name
          in: query
          description: Comma-separated exact tool names. Applies to both legs of a pair.
          required: false
          schema:
            type: string
        - name: hook_name
          in: query
          description: Comma-separated exact hook names. Applies to both legs of a pair.
          required: false
          schema:
            type: string
        - name: trigger_event
          in: query
          description: >-
            Comma-separated exact trigger events. Selects pairs whose opening
            event carries one of them.
          required: false
          schema:
            type: string
        - name: distribution_key_paths
          in: query
          description: >-
            Comma-separated payload keys to group the distribution by, first one
            present wins, e.g. `tool_name,tool`. Omit to skip the distribution.
          required: false
          schema:
            type: string
        - name: pair_key_paths
          in: query
          description: >-
            Comma-separated payload keys used to match a start event to its end
            event, first one present wins. Defaults to
            `tool_call_id,request_id,hook_id,id`; events carrying none of them
            pair in order within their session.
          required: false
          schema:
            type: string
        - name: payload_contains
          in: query
          description: >-
            Case-insensitive substring filter on a payload field, written
            `<key>:<text>`. Applies to both legs of a pair.
          required: false
          schema:
            type: string
        - name: payload_sum_paths
          in: query
          description: >-
            Comma-separated `<name>:<field>` pairs adding totals under `sums`.
            Only `duration_ms`, `input_tokens` and `output_tokens` can be
            summed.
          required: false
          schema:
            type: string
      responses:
        '200':
          description: >-
            The latency rollup: bounds, bins, heatmap, summary, events, and
            optionally distribution.
        '400':
          description: >-
            A required or malformed parameter. The body's `error` field says
            which.
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