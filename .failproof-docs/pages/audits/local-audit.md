> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Audit local agent history

> Scan supported agent CLI histories offline and review risky or wasteful behavior locally.

Use a local audit for an immediate, private review before connecting a machine to Failproof AI Cloud. It scans the agent histories already stored on your machine, replays tool activity through builtin policies, and opens a local results dashboard.

## Run an interactive audit

**Dashboard**

The local audit starts from the CLI because it must discover histories on the current machine. Run `failproofai audit`; after the scan, Failproof AI starts the bundled dashboard and opens **[http://localhost:8020/audit](http://localhost:8020/audit)**.

In the audit view, review the number of sessions, tool calls, projects, and policy hits. Start with frequent findings, then inspect the affected project and agent history before enabling enforcement.

> [!NOTE]
>
> The local audit dashboard is separate from **Analyze → Audits** in Failproof AI Cloud. Local audits remain on the machine and require no account or network connection.

**CLI**

```bash theme={null}
npm install -g failproofai
failproofai audit
```

The command performs a full scan of every supported history it finds. The current command does not accept filters such as `--since`, `--cli`, `--project`, `--port`, or `--no-open`.

Keep the process running while using the local dashboard. Press <kbd>Ctrl</kbd>+<kbd>C</kbd> when you are finished.

The current audit adapters can read histories from Claude Code, Codex, GitHub Copilot CLI, Cursor, OpenCode, Pi, Hermes, OpenClaw, Factory, Devin, Antigravity, and Goose. Only locally available histories are scanned.

## Schedule recurring local audits

**Dashboard**

Open **Settings** in the local dashboard, enable scheduled audits, choose the interval, and set the email address that should receive findings. The dashboard and CLI update the same machine configuration.

**CLI**

Enable a weekly audit and send findings to the named address:

```bash theme={null}
failproofai audit --schedule 7 --email reliability@example.com
failproofai audit --status
```

The interval accepts 1–90 days and defaults to 7 when omitted. The first setup signs you in when needed; `--email` supplies the report address without prompting.

Stop the schedule without deleting local audit history:

```bash theme={null}
failproofai audit --no-schedule
```

The daemon runs scheduled scans in the background, refreshes the cached result used by the local dashboard, and emails the configured report. Use `failproofai audit` when you want to run an interactive scan immediately.

## Move from local evidence to Cloud operations

A local audit is a fast baseline. Connect the machine to Failproof AI Cloud when you need shared traces, recurring population audits, findings and issues, alerts, organization-wide policy deployment, or fleet health.

> **[Create a Cloud audit](https://docs.befailproof.ai/audits/setup.md)**
>
> Define a recurring goal, population, evidence window, and response channels.

> **[Enable a policy](https://docs.befailproof.ai/start/first-policy.md)**
>
> Validate locally, publish deliberately, and deploy to a narrow machine group first.

> [!WARNING]
>
> Audit output is evidence for review, not proof that every flagged action is unsafe. Confirm context before turning a finding into blocking enforcement.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.