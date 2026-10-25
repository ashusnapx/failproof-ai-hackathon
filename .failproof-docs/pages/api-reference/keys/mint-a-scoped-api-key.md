> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Mint a scoped API key.

> You supply the secret in `key`; the server stores only its hash and never
returns it again. Generate it with a cryptographically secure random source.
`permissions` defaults to `["events:add"]` — an ingest-only key.



## OpenAPI

````yaml /reference/openapi.json post /keys
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
  /keys:
    post:
      tags:
        - Keys
      summary: Mint a scoped API key.
      description: >-
        You supply the secret in `key`; the server stores only its hash and
        never

        returns it again. Generate it with a cryptographically secure random
        source.

        `permissions` defaults to `["events:add"]` — an ingest-only key.
      operationId: create_key
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateKeyRequest'
        required: true
      responses:
        '201':
          description: Key created.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: >-
            The key lacks `keys:create`, or a requested permission is one the
            caller does not itself hold.
        '409':
          description: That name is already taken.
        '422':
          description: A requested permission is unknown or cannot be granted to a key.
      security:
        - api_key: []
components:
  schemas:
    CreateKeyRequest:
      type: object
      required:
        - name
        - key
      properties:
        expires_at:
          type:
            - string
            - 'null'
          format: date-time
          description: >-
            When the key stops working, RFC 3339. Omit for a key that never
            expires,

            which is every key minted through the normal flow.


            Only ever restrictive: an expiring key is strictly weaker than a

            permanent one, so accepting this from any `keys:create` holder
            grants

            nothing. Enforcement is in the auth lookup, with up to 60s of cache
            lag

            (see the migration and `crate::auth`).
        key:
          type: string
        name:
          type: string
        permissions:
          type:
            - array
            - 'null'
          items:
            type: string
          description: Defaults to `["events:add"]` if omitted.
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