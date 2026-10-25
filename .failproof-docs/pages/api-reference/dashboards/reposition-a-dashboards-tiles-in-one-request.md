> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Reposition a dashboard's tiles in one request.

> Send `{"tiles": [{id, pos_x, pos_y, pos_w, pos_h}, …]}`; every entry is
applied in a single transaction, so a whole drag-and-resize rearrangement
is one round-trip. Only geometry changes — the query, title and config on
each tile are left as they are.

Positions are validated before anything is written, so a bad entry rejects
the request without applying any of it. But `updated` echoes how many
entries you SENT, not how many rows actually changed: an id that is not a
tile on this dashboard is silently skipped. Send only ids you read back
from the dashboard.



## OpenAPI

````yaml /reference/openapi.json put /dashboards/{id}/tiles/layout
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
  /dashboards/{id}/tiles/layout:
    put:
      tags:
        - Dashboards
      summary: Reposition a dashboard's tiles in one request.
      description: >-
        Send `{"tiles": [{id, pos_x, pos_y, pos_w, pos_h}, …]}`; every entry is

        applied in a single transaction, so a whole drag-and-resize
        rearrangement

        is one round-trip. Only geometry changes — the query, title and config
        on

        each tile are left as they are.


        Positions are validated before anything is written, so a bad entry
        rejects

        the request without applying any of it. But `updated` echoes how many

        entries you SENT, not how many rows actually changed: an id that is not
        a

        tile on this dashboard is silently skipped. Send only ids you read back

        from the dashboard.
      operationId: update_tiles_layout
      parameters:
        - name: id
          in: path
          description: Dashboard whose tiles are being repositioned.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LayoutUpdateBody'
        required: true
      responses:
        '200':
          description: '`updated` is the number of entries submitted.'
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `dashboards:write`.
        '422':
          description: >-
            A tile's position is negative or its size is not positive; nothing
            was applied.
      security:
        - api_key: []
components:
  schemas:
    LayoutUpdateBody:
      type: object
      required:
        - tiles
      properties:
        tiles:
          type: array
          items:
            $ref: '#/components/schemas/LayoutItem'
    LayoutItem:
      type: object
      description: |-
        Bulk layout update: takes `[{id, pos_x, pos_y, pos_w, pos_h}, ...]` and
        applies them in a single transaction. Used by the drag/resize handler so
        every move is one round-trip instead of one per tile.
      required:
        - id
        - pos_x
        - pos_y
        - pos_w
        - pos_h
      properties:
        id:
          type: string
          format: uuid
        pos_h:
          type: integer
          format: int32
        pos_w:
          type: integer
          format: int32
        pos_x:
          type: integer
          format: int32
        pos_y:
          type: integer
          format: int32
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