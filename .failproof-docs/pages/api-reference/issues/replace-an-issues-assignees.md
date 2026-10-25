> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Replace an issue's assignees.

> A whole-list replace, not an add: `{"assignees": []}` clears everyone. (The
older single `assigned_to` string is still accepted — a string becomes a
one-element list, `null` clears — and is ignored when `assignees` is
present.) Every address must belong to an active member of your
organization; a typo or an outsider is rejected 422 before anything is
written, so the call never half-applies.

The permission check is on the DIFF, not on the request. With `issues:read`
you may take YOURSELF off the list, or send a no-op; adding anybody, or
removing somebody else, needs `issues:create` and is otherwise 403. Everyone
left on the list, plus you, is subscribed to the thread.



## OpenAPI

````yaml /reference/openapi.json post /issues/{iid}/assign
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
  /issues/{iid}/assign:
    post:
      tags:
        - Issues
      summary: Replace an issue's assignees.
      description: >-
        A whole-list replace, not an add: `{"assignees": []}` clears everyone.
        (The

        older single `assigned_to` string is still accepted — a string becomes a

        one-element list, `null` clears — and is ignored when `assignees` is

        present.) Every address must belong to an active member of your

        organization; a typo or an outsider is rejected 422 before anything is

        written, so the call never half-applies.


        The permission check is on the DIFF, not on the request. With
        `issues:read`

        you may take YOURSELF off the list, or send a no-op; adding anybody, or

        removing somebody else, needs `issues:create` and is otherwise 403.
        Everyone

        left on the list, plus you, is subscribed to the thread.
      operationId: assign_incident
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
              $ref: '#/components/schemas/AssignBody'
        required: true
      responses:
        '200':
          description: Assignees replaced; returns the stored list.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: >-
            The key lacks `issues:read`, or lacks `issues:create` for a change
            that adds an assignee or removes someone other than you.
        '404':
          description: No such issue in this organization.
        '422':
          description: >-
            An assignee is malformed or is not an active member of this
            organization.
      security:
        - api_key: []
components:
  schemas:
    AssignBody:
      type: object
      properties:
        assigned_to:
          type:
            - string
            - 'null'
          description: |-
            Legacy single-assignee shape. Kept so older API callers (the
            PR-1 collector hook + any external scripts) don't break the day
            the dashboard rolls forward. `null` clears, a string is treated
            as a one-element list. Ignored when `assignees` is present.
        assignees:
          type:
            - array
            - 'null'
          items:
            type: string
          description: |-
            Replacement assignee list. Empty array (or omitted) clears
            everyone. Preferred shape going forward.
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