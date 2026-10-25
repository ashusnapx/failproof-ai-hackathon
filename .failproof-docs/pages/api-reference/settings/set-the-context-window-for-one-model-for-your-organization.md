> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Set the context window for one model, for your organization.

> Body: `{ "model_id": "...", "context_window": N }`. Creates the override or
replaces the one already stored for that model id. `context_window` is in
tokens and must be between 0 and 1000000; 0 means "unknown", so no
context-fill percentage is computed for that model. The new value applies
from the next ingested event.

The model id travels in the BODY, not the path — which is why ids containing
`/` need no percent-encoding, and why this shares its path with the list and
delete operations.



## OpenAPI

````yaml /reference/openapi.json put /settings/model-context-windows
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
  /settings/model-context-windows:
    put:
      tags:
        - Settings
      summary: Set the context window for one model, for your organization.
      description: >-
        Body: `{ "model_id": "...", "context_window": N }`. Creates the override
        or

        replaces the one already stored for that model id. `context_window` is
        in

        tokens and must be between 0 and 1000000; 0 means "unknown", so no

        context-fill percentage is computed for that model. The new value
        applies

        from the next ingested event.


        The model id travels in the BODY, not the path — which is why ids
        containing

        `/` need no percent-encoding, and why this shares its path with the list
        and

        delete operations.
      operationId: put_override
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PutBody'
        required: true
      responses:
        '200':
          description: The stored override.
        '400':
          description: '`model_id` is missing, empty, or longer than 256 characters.'
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `settings:write`.
        '422':
          description: '`context_window` is missing, or outside 0…1000000.'
      security:
        - api_key: []
components:
  schemas:
    PutBody:
      type: object
      properties:
        context_window:
          type:
            - integer
            - 'null'
          format: int64
          description: >-
            The context-window size in tokens. Constrained to `[0, 1_000_000]`

            (0 = unknown → no fill); fits ClickHouse's UInt32 `context_window`
            column.
        model_id:
          type:
            - string
            - 'null'
          description: >-
            The model id to override, e.g. `anthropic/claude-sonnet-4`. 1–256

            characters; a `/` in the id needs no encoding because it never
            touches

            the path.
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