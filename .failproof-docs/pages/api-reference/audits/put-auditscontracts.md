> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Put auditscontracts

> Replace a contract. This is a full replacement, not a merge: the agent id and body are set to exactly what you send. Editing a contract changes what future audits expect; findings already raised keep referring to the text that was in force when they were raised.



## OpenAPI

````yaml /reference/openapi.json put /audits/contracts/{cid}
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
  /audits/contracts/{cid}:
    put:
      tags:
        - Audits
      description: >-
        Replace a contract. This is a full replacement, not a merge: the agent
        id and body are set to exactly what you send. Editing a contract changes
        what future audits expect; findings already raised keep referring to the
        text that was in force when they were raised.
      operationId: update_contract
      parameters:
        - name: cid
          in: path
          description: The contract's id.
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ContractBody'
        required: true
      responses:
        '200':
          description: The contract as stored.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `audits:write`.
        '404':
          description: No such contract in this organization.
        '409':
          description: Another contract already covers that agent.
        '422':
          description: The agent id or body is missing, malformed, or too long.
      security:
        - api_key: []
components:
  schemas:
    ContractBody:
      type: object
      required:
        - agent_id
        - body
      properties:
        agent_id:
          type: string
          description: >-
            The agent this contract governs, exactly as it appears in your
            telemetry.

            Case and surrounding whitespace are ignored when matching. A name
            that

            matches no agent is accepted, so take it from your agent list rather
            than

            typing it — otherwise the contract silently never applies.
        body:
          type: string
          description: >-
            The contract itself, as Markdown. Stored as written. Optional `---`

            frontmatter may set `purpose` and `cadence`; `## Outputs`, `## Done
            when`

            and `## Must not` headings are recognised as sections. Anything else
            is

            kept and shown to the analysis rather than rejected. Maximum 5,000

            characters — a contract is a page stating one agent's job, not a

            document.
        enabled:
          type:
            - boolean
            - 'null'
          description: >-
            Whether audits should grade against this contract. Defaults to true
            on

            creation, and is left unchanged when omitted on update.
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