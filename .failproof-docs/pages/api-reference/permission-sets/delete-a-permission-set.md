> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Delete a permission set.

> Members assigned to it keep the permissions they already have — they simply
stop being linked to a set — and the response reports how many were
unlinked as `affected_users`.

Two sets refuse deletion with 409: a builtin, and whichever set is currently
named by this organization's `default_user_permissions` setting. Point that
setting at another set before deleting this one.

Note the asymmetry: writing a set needs `settings:write`, while reading one
needs `users:read`.



## OpenAPI

````yaml /reference/openapi.json delete /permission-sets/{name}
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
  /permission-sets/{name}:
    delete:
      tags:
        - Permission sets
      summary: Delete a permission set.
      description: >-
        Members assigned to it keep the permissions they already have — they
        simply

        stop being linked to a set — and the response reports how many were

        unlinked as `affected_users`.


        Two sets refuse deletion with 409: a builtin, and whichever set is
        currently

        named by this organization's `default_user_permissions` setting. Point
        that

        setting at another set before deleting this one.


        Note the asymmetry: writing a set needs `settings:write`, while reading
        one

        needs `users:read`.
      operationId: delete_permission_set
      parameters:
        - name: name
          in: path
          description: The permission set's name.
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Deleted; `affected_users` counts the members unlinked.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `settings:write`.
        '404':
          description: No set by that name in this organization.
        '409':
          description: >-
            The set is a builtin, or is the organization's default for new
            users.
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