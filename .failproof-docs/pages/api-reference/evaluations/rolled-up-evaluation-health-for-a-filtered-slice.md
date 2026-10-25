> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Rolled-up evaluation health for a filtered slice.

> Takes the same filters as `/evaluations` and returns totals, a status
breakdown, per-score-key stats, and a time-bucketed timeline — computed over
the whole matching set, not a sample of it.

`bucket` is a request, not a guarantee: a fine bucket over a long range is
stepped up until the timeline fits 1500 points, and `timeline.bucket_unit`
reports the granularity actually used. `series` is opt-in and capped at 24
series; when the cap bites, `series_truncated` comes back true rather than
the response quietly containing fewer lines than you asked for.



## OpenAPI

````yaml /reference/openapi.json get /evaluations/aggregate
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
  /evaluations/aggregate:
    get:
      tags:
        - Evaluations
      summary: Rolled-up evaluation health for a filtered slice.
      description: >-
        Takes the same filters as `/evaluations` and returns totals, a status

        breakdown, per-score-key stats, and a time-bucketed timeline — computed
        over

        the whole matching set, not a sample of it.


        `bucket` is a request, not a guarantee: a fine bucket over a long range
        is

        stepped up until the timeline fits 1500 points, and
        `timeline.bucket_unit`

        reports the granularity actually used. `series` is opt-in and capped at
        24

        series; when the cap bites, `series_truncated` comes back true rather
        than

        the response quietly containing fewer lines than you asked for.
      operationId: aggregate_evaluations
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
          description: >-
            RFC 3339 lower bound on `completed_at` (inclusive). Also sets the
            default bucket width.
          required: false
          schema:
            type: string
        - name: ts_to
          in: query
          description: RFC 3339 upper bound on `completed_at` (inclusive). Defaults to now.
          required: false
          schema:
            type: string
        - name: score_filters
          in: query
          description: >-
            Comma-separated `key:min..max` ranges over the top-level numeric
            `scores` keys, at most 20. Same grammar as on `/evaluations`.
          required: false
          schema:
            type: string
        - name: metric_filters
          in: query
          description: >-
            Same grammar and 20-entry cap, matched against the nested metrics at
            `scores.metrics.<key>`.
          required: false
          schema:
            type: string
        - name: latest_per_session
          in: query
          description: >-
            Aggregate only the most recent evaluation per session. Default
            false.
          required: false
          schema:
            type: boolean
        - name: featured_keys
          in: query
          description: >-
            Comma-separated score keys whose per-bucket average the timeline
            should carry. De-duplicated and capped at 6; keys past the sixth are
            dropped.
          required: false
          schema:
            type: string
        - name: series
          in: query
          description: >-
            Opt-in chart series, as a JSON array of `[agent_id, environment,
            key, agg]` quads — e.g. `[["*","*","helpfulness","p90"]]`. `"*"` in
            the agent or environment slot means all of them combined. `agg` is
            one of `avg`, `min`, `max`, `p50`, `p75`, `p90`, `p95`, `p99`,
            `stddev`, `mode`. Malformed entries and unknown aggregations are
            dropped rather than failing the request; at most 24 survive.
          required: false
          schema:
            type: string
        - name: series_source
          in: query
          description: >-
            Where `series` reads from: `scores` (default, the 0-1 rate scores)
            or `metrics` (the nested magnitude metrics).
          required: false
          schema:
            type: string
        - name: bucket
          in: query
          description: >-
            Timeline granularity: `minute`, `5m`, `15m`, `hour`, `6h`, `day`,
            `week`, or `auto` (default, derived from the range). Coarsened when
            it would exceed 1500 buckets — read `timeline.bucket_unit` for what
            was used.
          required: false
          schema:
            type: string
      responses:
        '200':
          description: >-
            Totals, status counts, per-score-key stats and the timeline.
            `series` and `series_truncated` are present only when `series` was
            supplied.
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