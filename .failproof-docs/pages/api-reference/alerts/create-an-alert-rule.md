> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Create an alert rule.

> `trigger_kind` picks how the rule is evaluated — `metric_threshold`,
`custom_sql`, `evaluation_score`, `eval_compound` or `per_event` — and
`trigger_spec` is the free-form JSON that kind expects.

The scheduling fields work together: the dispatcher evaluates the rule every
`eval_interval_secs` (default 300, must be between 30 and 86400) and only
opens an issue once `min_breaches` of the last `eval_window` evaluations
breached (both default to 1, and `min_breaches` may not exceed
`eval_window`). Every entry in `channels` needs a `kind` of `email`, `slack`,
`webhook` or `dashboard`; omitting `channels` creates a rule that opens
issues but notifies nobody.

Returns the new alert's `id` and `created_at`. When the request came through
the dashboard, `created_by` records the human; a direct API call records the
API key's id instead.



## OpenAPI

````yaml /reference/openapi.json post /alerts
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
  /alerts:
    post:
      tags:
        - Alerts
      summary: Create an alert rule.
      description: >-
        `trigger_kind` picks how the rule is evaluated — `metric_threshold`,

        `custom_sql`, `evaluation_score`, `eval_compound` or `per_event` — and

        `trigger_spec` is the free-form JSON that kind expects.


        The scheduling fields work together: the dispatcher evaluates the rule
        every

        `eval_interval_secs` (default 300, must be between 30 and 86400) and
        only

        opens an issue once `min_breaches` of the last `eval_window` evaluations

        breached (both default to 1, and `min_breaches` may not exceed

        `eval_window`). Every entry in `channels` needs a `kind` of `email`,
        `slack`,

        `webhook` or `dashboard`; omitting `channels` creates a rule that opens

        issues but notifies nobody.


        Returns the new alert's `id` and `created_at`. When the request came
        through

        the dashboard, `created_by` records the human; a direct API call records
        the

        API key's id instead.
      operationId: create_alert
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AlertBody'
        required: true
      responses:
        '201':
          description: Alert created.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `alerts:write`.
        '422':
          description: Validation failed — `error` names the offending field.
      security:
        - api_key: []
components:
  schemas:
    AlertBody:
      type: object
      required:
        - name
        - trigger_kind
        - trigger_spec
      properties:
        channels: {}
        description:
          type:
            - string
            - 'null'
        enabled:
          type:
            - boolean
            - 'null'
        eval_interval_secs:
          type:
            - integer
            - 'null'
          format: int32
        eval_window:
          type:
            - integer
            - 'null'
          format: int32
        min_breaches:
          type:
            - integer
            - 'null'
          format: int32
        name:
          type: string
        severity:
          type:
            - string
            - 'null'
        trigger_kind:
          type: string
        trigger_spec: {}
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