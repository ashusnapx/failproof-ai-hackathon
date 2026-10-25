> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Comment on an issue.

> `body` is required and capped at 8000 characters after trimming. Needs only
`issues:read`: a responder who can see the issue can talk on its thread —
putting discussion behind a write grant would make read-only reviewers silent
observers. Commenting subscribes you to the thread and emails the other
subscribers.



## OpenAPI

````yaml /reference/openapi.json post /issues/{iid}/comments
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
  /issues/{iid}/comments:
    post:
      tags:
        - Issues
      summary: Comment on an issue.
      description: >-
        `body` is required and capped at 8000 characters after trimming. Needs
        only

        `issues:read`: a responder who can see the issue can talk on its thread
        —

        putting discussion behind a write grant would make read-only reviewers
        silent

        observers. Commenting subscribes you to the thread and emails the other

        subscribers.
      operationId: create_comment
      parameters:
        - name: iid
          in: path
          description: The issue's id.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCommentBody'
        required: true
      responses:
        '201':
          description: Comment created.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `issues:read`.
        '404':
          description: No such issue in this organization.
        '422':
          description: '`body` is empty or exceeds 8000 characters.'
      security:
        - api_key: []
components:
  schemas:
    CreateCommentBody:
      type: object
      required:
        - body
      properties:
        body:
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