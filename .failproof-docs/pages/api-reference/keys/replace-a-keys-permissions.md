> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Replace a key's permissions.

> No API key can call this. `keys:update` is deliberately not grantable to any
key — editing keys is a human, dashboard-only action — so a bearer token
always gets 403 here, permanently and by design. Use the dashboard's key
editor instead. The list you send replaces the key's grants outright rather
than adding to them, and keys seeded from configuration cannot be edited.



## OpenAPI

````yaml /reference/openapi.json patch /keys/{id}
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
  /keys/{id}:
    patch:
      tags:
        - Keys
      summary: Replace a key's permissions.
      description: >-
        No API key can call this. `keys:update` is deliberately not grantable to
        any

        key — editing keys is a human, dashboard-only action — so a bearer token

        always gets 403 here, permanently and by design. Use the dashboard's key

        editor instead. The list you send replaces the key's grants outright
        rather

        than adding to them, and keys seeded from configuration cannot be
        edited.
      operationId: update_key
      parameters:
        - name: id
          in: path
          description: The key's id, as returned by `GET /keys`.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateKeyRequest'
        required: true
      responses:
        '200':
          description: The key's metadata with its new permissions.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: >-
            The key lacks `keys:update` — which no API key may hold, so this is
            the response every key gets — or the target key is seeded from
            configuration and is protected.
        '404':
          description: No such key in this organization.
        '409':
          description: The key is revoked and cannot be edited.
        '422':
          description: >-
            Empty permission list, an unknown permission, or one that cannot be
            granted to a key.
      security:
        - api_key: []
components:
  schemas:
    UpdateKeyRequest:
      type: object
      required:
        - permissions
      properties:
        permissions:
          type: array
          items:
            type: string
          description: The key's complete new permission list — it REPLACES the old one.
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