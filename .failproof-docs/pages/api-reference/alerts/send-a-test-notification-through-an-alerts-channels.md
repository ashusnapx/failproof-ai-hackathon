> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Send a test notification through an alert's channels.

> Fires one synthetic notification so you can check a channel is actually
wired up. It touches no state: nothing is opened or resolved, no issue is
stored, and the `synthetic_incident_id` in the response belongs to no row —
do not try to fetch it.

Post the editor's current `channels` to test edits you have not saved yet;
with no body, the alert's saved channels are used. An empty email channel
falls back to the organization's default recipients, exactly as a real
notification would. Delivery is best-effort: 200 means the fan-out ran, not
that every channel accepted it.



## OpenAPI

````yaml /reference/openapi.json post /alerts/{id}/test
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
  /alerts/{id}/test:
    post:
      tags:
        - Alerts
      summary: Send a test notification through an alert's channels.
      description: >-
        Fires one synthetic notification so you can check a channel is actually

        wired up. It touches no state: nothing is opened or resolved, no issue
        is

        stored, and the `synthetic_incident_id` in the response belongs to no
        row —

        do not try to fetch it.


        Post the editor's current `channels` to test edits you have not saved
        yet;

        with no body, the alert's saved channels are used. An empty email
        channel

        falls back to the organization's default recipients, exactly as a real

        notification would. Delivery is best-effort: 200 means the fan-out ran,
        not

        that every channel accepted it.
      operationId: test_alert
      parameters:
        - name: id
          in: path
          description: The alert's id.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        description: Optional. Omit the body to use the alert's saved channels.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TestAlertRequest'
        required: true
      responses:
        '200':
          description: Fan-out ran; returns `ok` and a throwaway `synthetic_incident_id`.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `alerts:write`.
        '404':
          description: No such alert in this organization.
      security:
        - api_key: []
components:
  schemas:
    TestAlertRequest:
      type: object
      properties:
        channels:
          description: >-
            The editor's CURRENT (possibly-unsaved) channels. When present and a

            JSON array, the test fans out to these instead of the alert's saved

            channels, so "test" matches what the operator has selected/entered
            and

            resolves recipients identically to a save (an empty email channel
            still

            falls back to the org default recipients). Same shape as

            `alert_definitions.channels`.
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