> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# List findings across every audit in the organization, highest priority
first.

> This is the triage queue. Without a `status` filter it shows only the live
set — `open` and `recurring` — so triaged findings disappear from it; pass
`status` explicitly to see them. Narrow to one audit with `audit_id`, or to
the findings one run produced or touched with `run_id`. Each finding's
`issue_id` is the issue it graduated into, or null if it never did.



## OpenAPI

````yaml /reference/openapi.json get /audits/findings
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
  /audits/findings:
    get:
      tags:
        - Audits
      summary: |-
        List findings across every audit in the organization, highest priority
        first.
      description: >-
        This is the triage queue. Without a `status` filter it shows only the
        live

        set — `open` and `recurring` — so triaged findings disappear from it;
        pass

        `status` explicitly to see them. Narrow to one audit with `audit_id`, or
        to

        the findings one run produced or touched with `run_id`. Each finding's

        `issue_id` is the issue it graduated into, or null if it never did.
      operationId: list_findings
      parameters:
        - name: audit_id
          in: query
          description: Restrict to one audit.
          required: false
          schema:
            type: string
            format: uuid
        - name: run_id
          in: query
          description: Restrict to findings first or last seen by one run.
          required: false
          schema:
            type: string
            format: uuid
        - name: status
          in: query
          description: >-
            Comma-separated: `open`, `recurring`, `resolved`, `dismissed`,
            `muted`. Defaults to `open,recurring`.
          required: false
          schema:
            type: string
        - name: limit
          in: query
          description: Default 100, clamped to 1–500.
          required: false
          schema:
            type: integer
            format: int64
        - name: offset
          in: query
          description: Default 0.
          required: false
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: A page of findings, highest priority first.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `audits:read`.
        '422':
          description: '`status` names a status that does not exist.'
      security:
        - api_key: []
components:
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