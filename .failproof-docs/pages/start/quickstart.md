> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Capture an agent session, find a failure, and start preventing it.

This quickstart gets one machine reporting sessions, runs an audit, and deploys a policy. Use the skill to set Failproof up, or follow the manual steps.

**Which path is yours?** If your agent runs in one of the 12 supported [harnesses](https://docs.befailproof.ai/reference/harnesses.md) — a coding CLI, or a gateway like Hermes or OpenClaw — follow the steps below; you need Node.js 20.9 or later. If your agent has no harness, instrument it with the [Python SDK](https://docs.befailproof.ai/reference/custom-agents.md) for tracing and audits, then rejoin at [Run your first failure check](https://docs.befailproof.ai/start/first-audit.md); enforcement on that path needs a hook in your runtime.

**Use the skill**

**1. Install the Failproof AI skills**

```bash theme={null}
npx skills add FailproofAI/skills
```

**2. Ask your agent to set everything up**

```text theme={null}
Set up Failproof AI for this project, connect this machine, install the right hooks and policies, and verify that a session arrives.
```

Your agent inspects the project, chooses the relevant integration, performs the setup, and verifies it. See the [FailproofAI skills repository](https://github.com/FailproofAI/skills) for individual skills and advanced installation options.

**Manual setup**

## Install

**1. Install and connect Failproof AI**

```bash theme={null}
npm install -g failproofai
failproofai config
```

That one command is the whole of setup: it installs the local daemon (root once), wires hooks into every agent CLI it finds, and connects this machine to Cloud.

At **Connect to cloud**, setup starts logging you in to FailproofAI Cloud straight away (press Tab for the other options: paste an API key, or use open source). It opens a link in your browser (over SSH, or on a machine with no display, it prints the link so you can open it on any device). Sign up or sign in, confirm the org — or create one right there — and click **Authorize**. The key's name and permissions are set for you. You do not need an account beforehand.

The terminal notices on its own and shows who approved it and for which org. Confirm the agents to trace, and setup finishes. The machine's key is created only at that point, after the daemon is installed, so a run you abandon leaves no key behind; it appears under **Administration → Keys** marked **cli login**, where you can revoke it.

> **No browser or terminal at hand? Use a key (CI, containers, provisioning scripts)**
>
> In the [Failproof AI dashboard](https://app.befailproof.ai), go to **Administration → Keys** and create a key with `events:add` and `policies:pull`. If you plan to use [Jev through FailproofAI Cloud](https://docs.befailproof.ai/reference/jev-cloud.md), choose the **machine** preset, which also grants `jev:evaluate`. Copy the one-time secret and read it into a shell on the target machine — `read -s` takes it at a prompt that does not echo:
>
> ```bash theme={null}
> read -rs FAILPROOFAI_KEY && export FAILPROOFAI_KEY
> FAILPROOFAI_CLOUD_TOKEN="$FAILPROOFAI_KEY" failproofai config
> ```
>
> Passing the key through the environment rather than `--token` keeps it out of `ps`, where every user on the machine can read a command's arguments. It does not keep it out of shell history — reading it with `read -s` is what does that. In CI, inject it as a masked secret and keep shell tracing (`set -x`) off, or the trace prints it. In an interactive run you can also pick **Paste an API key** at **Connect to cloud** instead.

Session transcripts are sent by default. Add `--no-transcripts` to report hook activity and policy decisions without transcript content.

> [!WARNING]
>
> Do not reach for `failproofai config --connect <url>` here. That flag enrols a machine that is **already** set up and returns straight after — no daemon, no hooks — so the machine would appear in Cloud while collecting and enforcing nothing.

If this machine already has agent history, preview and import the last seven days, then wait for delivery to finish. Skip this step on a new machine.

```bash theme={null}
failproofai backfill --since 7d --dry-run
failproofai backfill --since 7d
failproofai flush --wait
```

Open **Sessions** in Failproof AI and select an imported session.

**2. Attach Failproof AI to a harness**

The previous step already wired every agent CLI it detected. Re-run it for one harness explicitly when you need to, or to add a harness installed afterwards. Every one of the 12 is a valid `--cli` value — `claude`, `codex`, `copilot`, `cursor`, `opencode`, `pi`, `hermes`, `openclaw`, `factory`, `devin`, `antigravity`, `goose`.

```bash theme={null}
failproofai policies --install --cli claude --scope user     # a coding CLI
failproofai policies --install --cli hermes --scope user     # a Slack/Telegram gateway
```

Blocking a tool call before it runs is verified on all 12. Turn-end gates are verified on 8 — see [enforcement capability](https://docs.befailproof.ai/reference/harnesses.md#enforcement-capability) for the per-harness matrix.

**3. Choose what to enforce**

Wiring hooks enables no policy. Setup deliberately picks none — that decision is yours — so take a pack:

```bash theme={null}
failproofai policies add FailproofAI/policies
```

The pack is fetched from its GitHub release, checksum-verified, and pinned to the exact tag it resolved. It carries 39 policies and switches on the 10 its manifest marks as safe to enable unattended. Use them to see local policy decisions and try enforcement before Failproof AI audits your sessions and writes policies for your agents.

Read any pack before taking it with `failproofai policies show <owner>/<repo>`, and see [policy packs](https://docs.befailproof.ai/policies/packs.md) for taking only part of one.

Until this runs, the only thing enforcing is `block-failproofai-commands` — the always-on guard that stops an agent switching Failproof AI off. `failproofai policies` lists what is on.

**4. Audit the behavior**

Follow [Run your first failure check](https://docs.befailproof.ai/start/first-audit.md). Use a concrete goal such as “find sessions where the agent retried a failing tool without changing its approach.”

**5. Prevent the failure**

Follow [Prevent your first failure with a policy](https://docs.befailproof.ai/start/first-policy.md). Start in observe mode, inspect matches, then enforce the reviewed version.

> [!TIP]
>
> Run `failproofai config --status`. A healthy setup reports the cloud connection, daemon state, and whether enforcement is paused.

## Jev setup

Use [Jev](https://docs.befailproof.ai/start/use-jev.md) to score finished sessions against a question with known answers, or to review tool calls in context before they run. The **Use Jev** page has both setup paths.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.