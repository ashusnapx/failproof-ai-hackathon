> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Choose your setup

> Choose local enforcement, Failproof AI Cloud, or an enterprise deployment.

> **Local enforcement**
>
> Set a machine up with no Cloud key and take a policy pack. Use this when you need immediate guardrails without sending session data to Cloud.

> **Failproof AI Cloud**
>
> Add centralized sessions, audits, online evaluations, dashboards, alerts, and fleet policy deployment.

> **Enterprise deployment**
>
> Use organization controls, scoped keys, private infrastructure, and deployment-specific security requirements.

## Enforce locally

Run `failproofai config` without a key, then take a pack with `failproofai policies add FailproofAI/policies`. In a terminal, pick **Not now — stay local** when setup asks to connect to Cloud; with no terminal and no `FAILPROOFAI_CLOUD_TOKEN`, it stays local on its own. The daemon and hooks enforce on the machine, and no session data is sent to Cloud. To connect later, follow the steps below.

## Recommended production path

1. Connect a non-production machine with transcript capture enabled.
2. Verify sessions and evaluations in Cloud.
3. Create an audit for a known failure mode.
4. Deploy the first policy in observe mode.
5. Expand to production after reviewing matches and false positives.

## Connect a machine to Cloud

**Dashboard**

1. Go to **Administration → Keys** and create a key with `events:add` and `policies:pull`.
2. Copy the one-time secret to the target machine.
3. After running the CLI connection command, go to **Admin → enforcement** and confirm the machine appears.
4. Go to **Observe → Events** and confirm its first event arrives.

The key drawer shows the two grants needed by a connected machine: event ingestion and policy delivery.

![The new API key drawer used to grant event ingestion and policy delivery permissions.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/key-create.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=a428bdae79f837471acb66414ff6455b)

After connection, the machine should appear in enforcement with its desired and reported policy state.

![The Enforcement fleet with an enrolled machine expanded to show its desired policy state and deployment status.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/enforcement-fleet.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=96be13256ef7e3fa89eeefcc4f1b7f10)

The first arriving event confirms that the daemon can deliver data to Cloud, independently of policy deployment.

![The live event stream showing recent agent, model, and tool events.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/events-stream-current.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=e87ba86b877f602de73237d5a3565269)

Continue only after both the machine and its first event are visible.

**CLI**

Read the one-time secret into the shell. `read -s` takes it at a prompt that does not echo, so it never appears in a command or in shell history:

```bash theme={null}
read -rs FAILPROOFAI_CLOUD_TOKEN && export FAILPROOFAI_CLOUD_TOKEN
```

Then set the machine up, choose its policies, and name it:

```bash theme={null}
failproofai config

failproofai policies add FailproofAI/policies
failproofai config --machine-label checkout-runner-01
failproofai config --status
```

`failproofai config` does the whole setup — daemon, hooks for every agent CLI it finds, and the Cloud connection — then chooses no policies, which is what the second command is for.

The label comes **after** connecting, not during: `failproofai config --machine-label <name>` renames a machine that is already connected, and on one that is not it does nothing but say so.

Add `--no-transcripts` when transcript content must remain local.

In CI, set `FAILPROOFAI_CLOUD_TOKEN` from the secret store instead of `read -s`, and keep shell tracing (`set -x`) off, or the trace prints the key.

> [!WARNING]
>
> On a machine that is **already** set up, `failproofai config --connect <url>` enrols it and nothing else. Do not use that form for a first install: it returns before the daemon or any hook is in place, leaving a machine that shows up in Cloud but collects and enforces nothing.

Connecting to Cloud verifies event ingestion and policy delivery independently. A key may therefore be valid but missing one required permission. Use `failproofai config --status` to see which capability is configured.

> [!NOTE]
>
> Cloud setup writes local credentials only after the relevant capability succeeds. A failed verification does not leave a machine looking connected when it is not.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.