> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Policies

> Observe, guide, or block agent actions before a known failure repeats.

A policy evaluates an agent hook event and returns one of three decisions:

* `allow` lets the action continue.
* `instruct` gives the agent corrective guidance.
* `deny` blocks the action with a reason.

## Where policies live

| In the dashboard | What you do there |
| - | - |
| **Observe → policy** | Review decisions from real sessions: which policy matched, on which machine, and why |
| **Admin → policy editor** | Write a policy, backtest it against past traffic, publish an immutable version, and compare versions in **library** |
| **Admin → enforcement** | Put versions on machines, in observe or enforce mode |

The policy editor is where a failure becomes a rule. Describe the failure mode or paste policy source in **compose**, backtest the draft against traffic you already have, and publish a version:

![The Policy editor compose view with policy identity, AI-assisted drafting, source validation, and publishing controls.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/policy-editor.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=7c01c862f4ec601d0535a6969eb619ce)

On a machine, `failproofai policies` lists everything enforcing there. `fp policies` and `fp fleet` cover the editor and enforcement from a terminal — see the [Cloud CLI reference](https://docs.befailproof.ai/reference/cloud-cli.md).

## Get a policy

There are two ways to get one.

> **[Write a policy](https://docs.befailproof.ai/policies/editor.md)**
>
> Let Failproof AI draft one from an audit finding, or write the source yourself, then review and publish it in the editor.

> **[Use a policy pack](https://docs.befailproof.ai/policies/packs.md)**
>
> Plug in a Failproof AI policy pack for your use case, or a community pack from the policy hub, in one command.

## Review tool calls with Jev

Jev reads a gated tool call in the context of your request. It can flag a concern that a string-matching policy missed or clear a deny from a policy explicitly marked **reviewable**. Hard policies remain final. [Start with Jev policies](https://docs.befailproof.ai/policies/jev.md), then use the [integration reference](https://docs.befailproof.ai/reference/jev.md) when you need provider or configuration details.

## Then ship it

**1. Test it**

Backtest the draft against traffic you already have, and run it against an action it must stop and one it must allow — all before you publish. See [Test a policy](https://docs.befailproof.ai/policies/test.md).

**2. Deploy it**

Put the version on machines in **observe** mode, read its decisions, then enforce. See [Deploy a policy](https://docs.befailproof.ai/policies/deploy.md).

**3. Version and roll back**

Every publish is a new, immutable version, so a rollout that blocks valid work is undone by redeploying the last good one. See [Versions and rollback](https://docs.befailproof.ai/policies/rollback.md).

To share your policies with other teams, [publish them as a pack](https://docs.befailproof.ai/policies/publish-a-pack.md). For what happens when a policy cannot be evaluated at all, see [Failure behavior](https://docs.befailproof.ai/policies/failure-behavior.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.