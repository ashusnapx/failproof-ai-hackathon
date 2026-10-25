> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Save a query.

> `sql_text` is stored exactly as written and is NOT checked here — the
restrictions on what may run are applied at execution time, so SQL that
saves cleanly can still be refused by `POST /queries/run`. Names must be
unique within the organization.

`params` is a JSON array declaring the query's positional parameters for the
editor; the server stores it verbatim and never interprets it.



## OpenAPI

````yaml /reference/openapi.json post /queries
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
  /queries:
    post:
      tags:
        - Queries
      summary: Save a query.
      description: >-
        `sql_text` is stored exactly as written and is NOT checked here — the

        restrictions on what may run are applied at execution time, so SQL that

        saves cleanly can still be refused by `POST /queries/run`. Names must be

        unique within the organization.


        `params` is a JSON array declaring the query's positional parameters for
        the

        editor; the server stores it verbatim and never interprets it.
      operationId: create_query
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpsertQueryRequest'
        required: true
      responses:
        '201':
          description: The created saved query.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `queries:write`.
        '409':
          description: A saved query with that name already exists in this organization.
        '422':
          description: '`name` or `sql_text` is blank, or `params` is not a JSON array.'
      security:
        - api_key: []
components:
  schemas:
    UpsertQueryRequest:
      type: object
      required:
        - name
        - sql_text
      properties:
        description:
          type: string
        name:
          type: string
        params: {}
        sql_text:
          type: string
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