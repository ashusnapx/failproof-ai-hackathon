> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Subscribe to an issue's activity emails.

> With no body you subscribe yourself, using the email your dashboard session
forwards. Passing `{"email": …}` for SOMEONE ELSE is a create-tier action: it
needs `issues:create`, and that address must belong to an active member of
your organization. Subscribing yourself works at `issues:read`, so a
read-only responder who acked can always manage their own notifications.

Idempotent — re-subscribing clears any earlier unsubscribe.



## OpenAPI

````yaml /reference/openapi.json post /issues/{iid}/subscribe
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
  /issues/{iid}/subscribe:
    post:
      tags:
        - Issues
      summary: Subscribe to an issue's activity emails.
      description: >-
        With no body you subscribe yourself, using the email your dashboard
        session

        forwards. Passing `{"email": …}` for SOMEONE ELSE is a create-tier
        action: it

        needs `issues:create`, and that address must belong to an active member
        of

        your organization. Subscribing yourself works at `issues:read`, so a

        read-only responder who acked can always manage their own notifications.


        Idempotent — re-subscribing clears any earlier unsubscribe.
      operationId: subscribe_incident
      parameters:
        - name: iid
          in: path
          description: The issue's id.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        description: Optional. Omit the body to subscribe yourself.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubscribeBody'
        required: true
      responses:
        '200':
          description: Subscribed; echoes the email.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: >-
            The key lacks `issues:read`, or lacks `issues:create` when
            subscribing someone other than you.
        '404':
          description: No such issue in this organization.
        '422':
          description: >-
            No usable email, or the address is not an active member of this
            organization.
      security:
        - api_key: []
components:
  schemas:
    SubscribeBody:
      type: object
      properties:
        email:
          type:
            - string
            - 'null'
          description: |-
            Optional override; defaults to the actor's forwarded email so a
            dashboard user can subscribe themselves with a bare POST.
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