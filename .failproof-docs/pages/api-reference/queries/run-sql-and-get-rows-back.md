> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Run SQL and get rows back.

> Send either `sql` (free-form) or `query_id` (a saved query to execute); if
both are present `sql` wins and `query_id` is recorded only as the run's
origin. `params` is a JSON array of positional values substituted for
`$1`…`$N` in the statement.

Results are scoped to your organization no matter how the SQL is written —
there is no way to phrase a query that reads another organization's data.

One read-only statement is accepted and nothing else:

* it must start with `SELECT` or `WITH`;
* a `;` outside a string literal is rejected — no multi-statement bodies;
* 8000 characters maximum;
* a single statement may not join the analytics tables (`events`,
  `evaluations`, `agent_sessions`) to the operational ones (`dashboards`,
  `saved_queries`, `api_keys`, `users`, …) — split it into two queries.

Use `GET /queries/schema` for the tables and columns you can read.

A successful run returns `{columns, rows, truncated, elapsed_ms}`, where
each entry in `rows` is an array of values positionally matching `columns`.
At most 10 000 rows come back; `truncated` is `true` when there were more,
so page with `LIMIT`/`OFFSET` in your own SQL rather than relying on the
cap. A run is cut off after 10 seconds.

A `NUMERIC` column comes back as `null` — cast it in the SELECT
(`avg(x)::float8`).

Every run, including a rejected or failed one, is recorded in the query
audit log with its SQL, parameters, duration and outcome.



## OpenAPI

````yaml /reference/openapi.json post /queries/run
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
  /queries/run:
    post:
      tags:
        - Queries
      summary: Run SQL and get rows back.
      description: >-
        Send either `sql` (free-form) or `query_id` (a saved query to execute);
        if

        both are present `sql` wins and `query_id` is recorded only as the run's

        origin. `params` is a JSON array of positional values substituted for

        `$1`…`$N` in the statement.


        Results are scoped to your organization no matter how the SQL is written
        —

        there is no way to phrase a query that reads another organization's
        data.


        One read-only statement is accepted and nothing else:


        * it must start with `SELECT` or `WITH`;

        * a `;` outside a string literal is rejected — no multi-statement
        bodies;

        * 8000 characters maximum;

        * a single statement may not join the analytics tables (`events`,
          `evaluations`, `agent_sessions`) to the operational ones (`dashboards`,
          `saved_queries`, `api_keys`, `users`, …) — split it into two queries.

        Use `GET /queries/schema` for the tables and columns you can read.


        A successful run returns `{columns, rows, truncated, elapsed_ms}`, where

        each entry in `rows` is an array of values positionally matching
        `columns`.

        At most 10 000 rows come back; `truncated` is `true` when there were
        more,

        so page with `LIMIT`/`OFFSET` in your own SQL rather than relying on the

        cap. A run is cut off after 10 seconds.


        A `NUMERIC` column comes back as `null` — cast it in the SELECT

        (`avg(x)::float8`).


        Every run, including a rejected or failed one, is recorded in the query

        audit log with its SQL, parameters, duration and outcome.
      operationId: run_query
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RunQueryRequest'
        required: true
      responses:
        '200':
          description: '`columns`, `rows`, `truncated` and `elapsed_ms`.'
        '400':
          description: >-
            The statement failed to execute, or a `$N` parameter could not be
            substituted.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: >-
            The key lacks `queries:run`, or the statement referenced something
            it is not allowed to read.
        '404':
          description: '`query_id` names no saved query in this organization.'
        '422':
          description: >-
            Neither `sql` nor `query_id` was sent, the statement is not a single
            `SELECT`/`WITH` under 8000 characters, or it tried to write.
        '504':
          description: The query exceeded the 10-second statement timeout.
      security:
        - api_key: []
components:
  schemas:
    RunQueryRequest:
      type: object
      properties:
        params:
          description: >-
            Positional or named parameter values. For positional ($1..$N) pass
            an

            array; for named pass an object. Only string/number/bool/null/array

            JSON leaves are bound — anything else is sent as text.
        query_id:
          type:
            - string
            - 'null'
          format: uuid
          description: Saved query id — sql_text is fetched and substituted in.
        sql:
          type:
            - string
            - 'null'
          description: Free-form SQL — wins over `query_id` if both are present.
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