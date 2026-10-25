> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Open an issue by hand, with no parent alert.

> For a failure that doesn't map to any configured rule. `summary` is required
and capped at 2000 characters; `title` is optional and falls back to the
summary's first 200 characters; `severity` is `info`, `warning` (the default)
or `critical`.

An issue opened this way never fans out through alert channels — there is no
parent whose channels it could inherit — so it is a triage thread and
nothing more. You are subscribed to it automatically.



## OpenAPI

````yaml /reference/openapi.json post /issues
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
  /issues:
    post:
      tags:
        - Issues
      summary: Open an issue by hand, with no parent alert.
      description: >-
        For a failure that doesn't map to any configured rule. `summary` is
        required

        and capped at 2000 characters; `title` is optional and falls back to the

        summary's first 200 characters; `severity` is `info`, `warning` (the
        default)

        or `critical`.


        An issue opened this way never fans out through alert channels — there
        is no

        parent whose channels it could inherit — so it is a triage thread and

        nothing more. You are subscribed to it automatically.
      operationId: create_orphan_incident
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrphanIncidentBody'
        required: true
      responses:
        '201':
          description: Issue opened.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `issues:create`.
        '422':
          description: >-
            `summary` is missing or too long, `title` exceeds 200 characters, or
            `severity` is not one of `info`, `warning`, `critical`.
      security:
        - api_key: []
components:
  schemas:
    CreateOrphanIncidentBody:
      type: object
      required:
        - summary
      properties:
        severity:
          type:
            - string
            - 'null'
          description: |-
            Optional severity for the orphan incident. Defaults to `warning`
            when omitted; values outside `info | warning | critical` are
            rejected with 422.
        summary:
          type: string
        title:
          type:
            - string
            - 'null'
          description: >-
            REQUIRED here, but deserialized as an `Option` on purpose: a bare

            `String` makes a title-less body fail inside the axum extractor,
            which

            answers with a raw serde message ("missing field `title`") and makes

            the handler's own friendly check below unreachable. Accepting `None`

            at the deserialization layer moves the rejection into the handler,

            where it becomes an explainable 422. The requirement itself is

            unchanged — see the `title is required` branch in

            `create_orphan_incident`.
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