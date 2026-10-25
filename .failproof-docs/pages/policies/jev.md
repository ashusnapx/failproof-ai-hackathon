> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Jev policies

> Add Jev's live review to gated tool calls, then inspect it before enforcing its decisions.

Jev reads a tool call against what the person asked the agent to do. Use it when a string-matching policy blocks valid work or misses a risky action that needs context. It answers alongside your policies at the `PreToolUse` or `PermissionRequest` gate. For a score **after** a session ends, use [Jev evaluations](https://docs.befailproof.ai/evaluations/jev.md).

## Start in observe mode

Install Failproof AI and attach hooks to a [supported harness](https://docs.befailproof.ai/reference/harnesses.md). Use failproofai 1.0.8-beta.0 or later.

Failproof AI ships no Jev checks. Install them as a pack, or Jev has nothing to ask and is never called:

```bash theme={null}
failproofai policies add FailproofAI/jev-policies
```

Then choose how requests reach Jev:

| Route | First step |
| - | - |
| FailproofAI Cloud | Connect with a **machine** key carrying `jev:evaluate`. On a machine with no Jev config, `failproofai config` turns Jev on in observe mode. |
| Your own provider | In the local dashboard, open **Settings → Jev**, choose the provider, paste its token, and select **observe**. Or run `failproofai jev --url https://api.typesafe.ai/v1 --mode observe --key-stdin < ~/typesafe.key`. |

![The local dashboard's Jev settings: provider, endpoint, token, and observe mode before turning Jev on.](https://mintcdn.com/exosphere/iOjAK1F5HjkAlttv/images/dashboard/jev-settings.png?fit=max\&auto=format\&n=iOjAK1F5HjkAlttv\&q=85\&s=cdfbae016b662739a213d9507fdfbd43)

```bash theme={null}
failproofai jev status
failproofai jev test
```

`test` checks the endpoint. To check the hook path, ask a hooked agent to use its file-reading tool on `README.md`. Confirm that tool call appears in the session, then inspect **Policies → Activity** in the [local dashboard](https://docs.befailproof.ai/reference/local-dashboard.md#review-policy-activity). The Jev count in `status` should increase. Observe mode records what Jev would have decided while your existing policy result still applies.

## Decide when to enforce

A **hard** policy always has the final say. Jev may clear a deny only from a policy explicitly marked **reviewable** and only when it checked that policy's named concern. See [policy authority](https://docs.befailproof.ai/policies/authority.md) before relying on a clearance. Jev can also warn or deny on its own. If it cannot answer, the policy result decides that call.

Once the observe results look right, switch to enforce mode in **Settings → Jev** or run:

```bash theme={null}
failproofai jev setup --mode enforce
```

For provider URLs, Cloud keys, configuration, fallbacks, and data sent with each request, see the [Jev integration reference](https://docs.befailproof.ai/reference/jev.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.