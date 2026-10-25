> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Triage a finding.

> `action` is one of `ack`, `mute`, `dismiss`, `resolve`, `reopen` or
`assign`; `assign` additionally requires `assigned_to`, and any action may
carry a free-text `reason`.

`mute` and `dismiss` record durable feedback keyed on the finding's
fingerprint, which suppresses that pattern across EVERY audit in the
organization — not just the one you are looking at. `reopen` clears that
suppression. `resolve` records none, so a pattern that comes back is filed
again as new. `ack` keeps the finding visible but deprioritized.

Set `X-AgentEye-Actor` to attribute the action to a person; without it the
API key's id is recorded instead. If the finding graduated into an issue,
the issue is updated to match on a best-effort basis — a failure there is
logged and does not fail the triage, which has already committed.



## OpenAPI

````yaml /reference/openapi.json post /audits/findings/{fid}/status
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
  /audits/findings/{fid}/status:
    post:
      tags:
        - Audits
      summary: Triage a finding.
      description: >-
        `action` is one of `ack`, `mute`, `dismiss`, `resolve`, `reopen` or

        `assign`; `assign` additionally requires `assigned_to`, and any action
        may

        carry a free-text `reason`.


        `mute` and `dismiss` record durable feedback keyed on the finding's

        fingerprint, which suppresses that pattern across EVERY audit in the

        organization — not just the one you are looking at. `reopen` clears that

        suppression. `resolve` records none, so a pattern that comes back is
        filed

        again as new. `ack` keeps the finding visible but deprioritized.


        Set `X-AgentEye-Actor` to attribute the action to a person; without it
        the

        API key's id is recorded instead. If the finding graduated into an
        issue,

        the issue is updated to match on a best-effort basis — a failure there
        is

        logged and does not fail the triage, which has already committed.
      operationId: update_finding_status
      parameters:
        - name: fid
          in: path
          description: The finding's id.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/StatusBody'
        required: true
      responses:
        '200':
          description: The action was applied.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `audits:write`.
        '404':
          description: No such finding in this organization.
        '422':
          description: Unknown `action`, or `assign` without `assigned_to`.
      security:
        - api_key: []
components:
  schemas:
    StatusBody:
      type: object
      required:
        - action
      properties:
        action:
          type: string
          description: ack | mute | dismiss | resolve | reopen | assign
        assigned_to:
          type:
            - string
            - 'null'
        reason:
          type:
            - string
            - 'null'
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