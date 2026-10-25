> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Re-enable a disabled member.

> Requires `users:delete`, NOT `users:create`. Enabling and disabling are two
halves of the same lifecycle action and share one permission, so a key that
can invite members cannot bring a disabled one back — that takes the same
grant as offboarding. Clearing `disabled_at` restores sign-in across every
organization the user belongs to, but only a member of the calling
organization can be enabled.

`POST /users/:id/enable` — flip `disabled_at` back to NULL so the user can sign in again.
Reuses `users:delete` permission because enable is the inverse of the same lifecycle action.

Atomic: the UPDATE filters on `disabled_at IS NOT NULL` so two concurrent
enables can't both report success (only the first will return a row; the
second sees no row and falls back to a follow-up SELECT to distinguish
"user is not disabled" (409) from "user does not exist" (404).



## OpenAPI

````yaml /reference/openapi.json post /users/{id}/enable
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
  /users/{id}/enable:
    post:
      tags:
        - Users
      summary: Re-enable a disabled member.
      description: >-
        Requires `users:delete`, NOT `users:create`. Enabling and disabling are
        two

        halves of the same lifecycle action and share one permission, so a key
        that

        can invite members cannot bring a disabled one back — that takes the
        same

        grant as offboarding. Clearing `disabled_at` restores sign-in across
        every

        organization the user belongs to, but only a member of the calling

        organization can be enabled.


        `POST /users/:id/enable` — flip `disabled_at` back to NULL so the user
        can sign in again.

        Reuses `users:delete` permission because enable is the inverse of the
        same lifecycle action.


        Atomic: the UPDATE filters on `disabled_at IS NOT NULL` so two
        concurrent

        enables can't both report success (only the first will return a row; the

        second sees no row and falls back to a follow-up SELECT to distinguish

        "user is not disabled" (409) from "user does not exist" (404).
      operationId: enable_user
      parameters:
        - name: id
          in: path
          description: The user's id.
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: The user is enabled, with their grants in this organization.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: >-
            The key lacks `users:delete` — enabling is gated on the delete
            permission, not `users:create`.
        '404':
          description: No such member in this organization.
        '409':
          description: The user is not disabled.
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