> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Enqueue a fresh evaluation job for a session. Used by the dashboard's
re-evaluate button when a session was missed by the automatic pipeline
(e.g. no agent_end ever arrived) or when the user wants fresh scores
after deploying a new evaluator.

> The `eval_enqueued` guard on `agent_sessions` only gates ingest-driven
enqueue (so duplicate `agent_end` events can't re-evaluate). Manual
re-eval bypasses it: we insert directly into `evaluation_jobs`. The
dispatcher's terminal-result writer already upserts on `session_id`,
so the new run naturally overwrites the previous `evaluations` row.
Re-run the evaluation for one session.

Enqueues a job and returns 202 immediately — the scores are NOT ready when
this returns. Poll `/evaluation-jobs` for progress, `/evaluations` for the
result. The new run overwrites the session's previous evaluation.

Requires `evaluations:trigger`, not `evaluations:read` — a read-only key
cannot start work.

One job per session at a time: if an evaluation for this session is already
queued or in flight, this is a 409. Wait for it to finish, then trigger again.



## OpenAPI

````yaml /reference/openapi.json post /sessions/{session_id}/re-evaluate
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
  /sessions/{session_id}/re-evaluate:
    post:
      tags:
        - Evaluations
      summary: |-
        Enqueue a fresh evaluation job for a session. Used by the dashboard's
        re-evaluate button when a session was missed by the automatic pipeline
        (e.g. no agent_end ever arrived) or when the user wants fresh scores
        after deploying a new evaluator.
      description: >-
        The `eval_enqueued` guard on `agent_sessions` only gates ingest-driven

        enqueue (so duplicate `agent_end` events can't re-evaluate). Manual

        re-eval bypasses it: we insert directly into `evaluation_jobs`. The

        dispatcher's terminal-result writer already upserts on `session_id`,

        so the new run naturally overwrites the previous `evaluations` row.

        Re-run the evaluation for one session.


        Enqueues a job and returns 202 immediately — the scores are NOT ready
        when

        this returns. Poll `/evaluation-jobs` for progress, `/evaluations` for
        the

        result. The new run overwrites the session's previous evaluation.


        Requires `evaluations:trigger`, not `evaluations:read` — a read-only key

        cannot start work.


        One job per session at a time: if an evaluation for this session is
        already

        queued or in flight, this is a 409. Wait for it to finish, then trigger
        again.
      operationId: trigger_evaluation
      parameters:
        - name: session_id
          in: path
          description: The session to re-evaluate.
          required: true
          schema:
            type: string
      responses:
        '202':
          description: 'Job queued. Returns the `session_id` and `status: "queued"`.'
        '401':
          description: Missing, unknown, or disabled key.
        '403':
          description: >-
            The key lacks `evaluations:trigger`, OR this deployment does not
            evaluate your organization at all — that gate is checked before the
            session is looked up, so an excluded organization gets 403 whether
            or not the session exists.
        '404':
          description: No such session in this organization.
        '409':
          description: An evaluation for this session is already queued or in flight.
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