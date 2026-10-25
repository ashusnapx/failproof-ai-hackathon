> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Update an audit definition.

> `name` is required and always overwritten; every other field is optional and
an omitted one keeps its current value — there is no way to clear a field
back to NULL here. The same ranges as create apply. A changed
`schedule_interval_secs` or `schedule_anchor` takes effect at the next
reschedule, not on the run already queued.



## OpenAPI

````yaml /reference/openapi.json put /audits/{id}
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
  /audits/{id}:
    put:
      tags:
        - Audits
      summary: Update an audit definition.
      description: >-
        `name` is required and always overwritten; every other field is optional
        and

        an omitted one keeps its current value — there is no way to clear a
        field

        back to NULL here. The same ranges as create apply. A changed

        `schedule_interval_secs` or `schedule_anchor` takes effect at the next

        reschedule, not on the run already queued.
      operationId: update_audit
      parameters:
        - name: id
          in: path
          description: The audit's id.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AuditBody'
        required: true
      responses:
        '200':
          description: Audit updated.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `audits:write`.
        '404':
          description: No such audit in this organization.
        '422':
          description: The payload failed validation; `error` names the problem.
      security:
        - api_key: []
components:
  schemas:
    AuditBody:
      type: object
      required:
        - name
      properties:
        additional_context:
          description: >-
            NOT writable here — see `PUT /audits/{id}/context`.


            Present ONLY so a client that sends it gets a loud 422 instead of
            serde's

            default of silently ignoring an unknown field, which is how a whole

            feature goes missing with a green test suite.
        channels: {}
        context:
          oneOf:
            - type: 'null'
            - $ref: '#/components/schemas/ContextBody'
              description: >-
                Reference context to store WITH the definition. **Create only**
                — an

                update sending it gets the same 422 as the two fields above.


                It lives here for one reason, and the reason is a race, not
                convenience:

                the insert trigger queues an eval job whose `next_attempt_at`
                defaults to

                `now()`, so a new enabled audit is due the instant its row
                commits. A

                client that created the audit and then wrote its context in a
                second

                request could be overtaken by the dispatcher, and the first run
                — the one

                an operator watches — would argue without the brief they just
                typed.

                Writing both in one transaction removes the window rather than
                narrowing

                it: the job row and the context rows become visible together.


                Why an update must NOT accept it: `_audit_to_body` (CLI) and

                `auditToInput` (dashboard) rebuild this whole body from an
                allowlist

                before every save, so a context field on the update path would
                be wiped

                by any unrelated edit — 200 OK, no error, brief gone. Create has
                no

                read-merge step and therefore no such hazard. See the module
                comment in

                `routes/audit_context.rs`.
        control_sample_rate:
          type:
            - number
            - 'null'
          format: float
        description:
          type:
            - string
            - 'null'
        enabled:
          type:
            - boolean
            - 'null'
        ignore_error_types:
          type:
            - array
            - 'null'
          items:
            type: string
        llm_budget: {}
        llm_enabled:
          type:
            - boolean
            - 'null'
        llm_spec: {}
        lookback_window_secs:
          type:
            - integer
            - 'null'
          format: int32
        min_count:
          type:
            - integer
            - 'null'
          format: int32
        min_rate:
          type:
            - number
            - 'null'
          format: float
        name:
          type: string
        reference_urls:
          description: NOT writable here — see `PUT /audits/{id}/context`.
        schedule_anchor:
          type:
            - string
            - 'null'
          format: date-time
          description: >-
            Fixed phase for the schedule: runs land on `anchor + N * interval`.

            Omitted on create → `default_schedule_anchor()` (next 09:00 UTC,
            matching

            the 09:00 backfill in 20260721000200). Omitted on update →
            unchanged.

            NULL in the DB is still tolerated by the dispatcher (legacy drift
            path)

            but nothing this route writes can produce it any more.
        schedule_interval_secs:
          type:
            - integer
            - 'null'
          format: int32
        scope: {}
        sensitivity:
          type:
            - string
            - 'null'
        signals: {}
        top_k:
          type:
            - integer
            - 'null'
          format: int32
        window_mode:
          type:
            - string
            - 'null'
    ContextBody:
      type: object
      properties:
        text:
          type: string
          description: >-
            The audit's written brief. Replaced wholesale — send an empty string
            to

            clear it. Limited to 8192 characters.
        urls:
          type: array
          items:
            type: string
          description: >-
            Reference URLs this audit draws on. Replaced wholesale — send an
            empty

            array to remove every source and the text stored for it. The order
            you

            send is the order they are used. At most 5.
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