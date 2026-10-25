> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# The magnitude-metric names under `scores.metrics`, each with its unit.

> Returns a JSON array of `{name, unit, count}` objects. Kept separate from
`score_keys` because the two are on different scales: score keys are 0-1
rates that share one axis, metrics carry units (ms, USD, tokens) and must not
be plotted against each other. `unit` is an empty string for metrics recorded
before units existed. Cached per organization for 60 seconds.

Note the underscore: the path is `/evaluations/metric_keys`.



## OpenAPI

````yaml /reference/openapi.json get /evaluations/metric_keys
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
  /evaluations/metric_keys:
    get:
      tags:
        - Evaluations
      summary: The magnitude-metric names under `scores.metrics`, each with its unit.
      description: >-
        Returns a JSON array of `{name, unit, count}` objects. Kept separate
        from

        `score_keys` because the two are on different scales: score keys are 0-1

        rates that share one axis, metrics carry units (ms, USD, tokens) and
        must not

        be plotted against each other. `unit` is an empty string for metrics
        recorded

        before units existed. Cached per organization for 60 seconds.


        Note the underscore: the path is `/evaluations/metric_keys`.
      operationId: list_metric_keys
      responses:
        '200':
          description: A JSON array of `{name, unit, count}` objects, sorted by name.
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