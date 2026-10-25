> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Define a new permission set.

> `permissions` is the list of grants the set confers; every entry must be a
known permission and the list may not repeat one. Names are trimmed, capped
at 64 characters, and unique within the organization. The set is created
with no members — assign it to users through `/users`.

Note the asymmetry: writing a set needs `settings:write`, while reading one
needs `users:read`.



## OpenAPI

````yaml /reference/openapi.json post /permission-sets
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
  /permission-sets:
    post:
      tags:
        - Permission sets
      summary: Define a new permission set.
      description: >-
        `permissions` is the list of grants the set confers; every entry must be
        a

        known permission and the list may not repeat one. Names are trimmed,
        capped

        at 64 characters, and unique within the organization. The set is created

        with no members — assign it to users through `/users`.


        Note the asymmetry: writing a set needs `settings:write`, while reading
        one

        needs `users:read`.
      operationId: create_permission_set
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePermissionSetRequest'
        required: true
      responses:
        '201':
          description: The set was created.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `settings:write`.
        '409':
          description: A set with that name already exists in this organization.
        '422':
          description: >-
            The name is empty or over 64 characters, or a permission is unknown
            or duplicated.
      security:
        - api_key: []
components:
  schemas:
    CreatePermissionSetRequest:
      type: object
      required:
        - name
        - permissions
      properties:
        description:
          type:
            - string
            - 'null'
        name:
          type: string
          description: Unique within the organization; trimmed, max 64 characters.
        permissions:
          type: array
          items:
            type: string
          description: >-
            The grants the set confers, e.g. `["events:read", "users:read"]`.
            Every

            entry must be a known permission, with no duplicates.
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