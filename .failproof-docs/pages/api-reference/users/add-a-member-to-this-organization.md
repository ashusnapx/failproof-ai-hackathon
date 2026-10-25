> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Add a member to this organization.

> Send `permission_set` plus optional `permission_added` / `permission_removed`
overrides; the server resolves them and returns the effective grants in
`permissions`. The older flat `permissions` array still works and is read as
`permission_added` against no set. The address is trimmed and lowercased.

Accounts are global, membership is per-organization: inviting someone who
already has an account elsewhere reuses it, so a 409 means they are already a
member *here* — `error` is `user_exists`, or `user_disabled` if the account is
disabled globally and should be re-enabled instead. Being added does not by
itself guarantee sign-in: the organization's `allowed_sign_ins` list is
applied separately, at sign-in. The welcome email is best-effort — the member
exists even if it fails to send.



## OpenAPI

````yaml /reference/openapi.json post /users
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
  /users:
    post:
      tags:
        - Users
      summary: Add a member to this organization.
      description: >-
        Send `permission_set` plus optional `permission_added` /
        `permission_removed`

        overrides; the server resolves them and returns the effective grants in

        `permissions`. The older flat `permissions` array still works and is
        read as

        `permission_added` against no set. The address is trimmed and
        lowercased.


        Accounts are global, membership is per-organization: inviting someone
        who

        already has an account elsewhere reuses it, so a 409 means they are
        already a

        member *here* — `error` is `user_exists`, or `user_disabled` if the
        account is

        disabled globally and should be re-enabled instead. Being added does not
        by

        itself guarantee sign-in: the organization's `allowed_sign_ins` list is

        applied separately, at sign-in. The welcome email is best-effort — the
        member

        exists even if it fails to send.
      operationId: create_user
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
        required: true
      responses:
        '201':
          description: Member added, with their resolved permissions.
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: The key lacks `users:create`.
        '409':
          description: >-
            Already a member of this organization; `error` is `user_exists` or
            `user_disabled`.
        '422':
          description: >-
            Invalid email, an unknown permission, or a `permission_set` that
            does not exist.
      security:
        - api_key: []
components:
  schemas:
    CreateUserRequest:
      type: object
      required:
        - email
      properties:
        email:
          type: string
        permission_added:
          type:
            - array
            - 'null'
          items:
            type: string
          description: Grants added on top of the set.
        permission_removed:
          type:
            - array
            - 'null'
          items:
            type: string
          description: Grants removed from the set.
        permission_set:
          type:
            - string
            - 'null'
          description: 'New shape: name of the permission set this user is linked to.'
        permissions:
          type:
            - array
            - 'null'
          items:
            type: string
          description: |-
            Legacy shape: explicit permission list. When set, it's treated as
            `permission_added` against no set. The dashboard's new code path
            sends `permission_set` + `permission_added` + `permission_removed`
            instead; this field exists only for backwards compatibility with
            callers that haven't been upgraded.
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