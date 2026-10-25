> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrations and reference

> Connect supported agent harnesses, SDKs, CLIs, and the HTTP API.

Choose the integration closest to where your agent already runs.

> **[Agent harnesses](https://docs.befailproof.ai/reference/harnesses.md)**
>
> Install hooks for supported coding and autonomous agent CLIs.

> **[Agent frameworks and SDKs](https://docs.befailproof.ai/start/integrations.md)**
>
> Instrument LangGraph, CrewAI, LlamaIndex, Pydantic AI, or a custom agent.

> **[Python SDK reference](https://docs.befailproof.ai/reference/custom-agents.md)**
>
> Configuration, the event catalog, correlation rules, and delivery.

> **[Local dashboard](https://docs.befailproof.ai/reference/local-dashboard.md)**
>
> Review local projects, sessions, policy activity, and offline audits.

> **[Failproof AI CLI](https://docs.befailproof.ai/reference/failproof-cli.md)**
>
> Configure local capture, hooks, policies, audits, delivery, and machine state.

> **[Jev integration](https://docs.befailproof.ai/reference/jev.md)**
>
> Compare session evaluations with live policy review, then configure providers, keys, and modes.

> **[Failproof Cloud CLI](https://docs.befailproof.ai/reference/cloud-cli.md#cli-commands)**
>
> Query and administer Cloud sessions, audits, issues, alerts, keys, users, and settings.

> **[Evaluator SDK](https://docs.befailproof.ai/reference/evaluator-sdk.md)**
>
> Score complete or inactive sessions with a FastAPI service.

> **[Custom policies](https://docs.befailproof.ai/reference/policy-sdk.md)**
>
> Author and test workflow-specific allow, instruct, and deny decisions.

> **[Self-hosting](https://docs.befailproof.ai/reference/self-hosting.md)**
>
> Deploy the Cloud control plane on a customer-managed Kubernetes cluster.

The generated [HTTP API reference](https://docs.befailproof.ai/reference/http-api.md) covers the public `/v1` surface. Hand-written pages explain workflows that span multiple endpoints or use administrative interfaces outside that public surface.

## Connect an agent and verify data

**Dashboard**

1. Open **Administration → Keys**, create a key with `events:add` and `policies:pull`, and copy the secret.
2. Configure the integration using the matching page above.
3. Open **Observe → Events** to confirm events arrive, then **Observe → Sessions** to confirm they form complete runs.
4. Filter to the integration's environment and inspect one session for the model, tool, error, and policy fields needed by audits.

Start with the key drawer. The selected grants determine whether the machine can send events and receive Cloud-managed policies.

![The new API key drawer used to grant event ingestion and policy delivery permissions.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/key-create.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=a428bdae79f837471acb66414ff6455b)

After connecting the integration, use the Sessions list to confirm that its events are being grouped into complete runs in the expected environment.

![The Sessions list used to verify that a newly connected integration is reporting complete agent runs.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/sessions-list.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=f1fb545746143e87b8b5daedabfc5559)

Open one of these sessions before considering the integration complete; the trace should contain the model, tool, error, and policy evidence your audits need.

**CLI**

Create a machine key, then read the secret it prints into the shell. `read -s` takes it at a prompt that does not echo, so it never appears in a command or in shell history:

```bash theme={null}
fp keys create agent-production \
  --add events:add \
  --add policies:pull
read -rs FAILPROOFAI_CLOUD_TOKEN && export FAILPROOFAI_CLOUD_TOKEN
```

Connect the Failproof daemon and verify the first session:

```bash theme={null}
failproofai config

failproofai flush --wait
fp sessions --since 1h --env production
fp events --since 1h --env production --limit 20
```

Use `fp --json sessions ...` when another tool will consume the result. Global flags such as `--json`, `--org`, and `--base-url` must come before the command.

See the [Failproof AI CLI reference](https://docs.befailproof.ai/reference/failproof-cli.md) for local commands and the [Failproof Cloud CLI reference](https://docs.befailproof.ai/reference/cloud-cli.md#cli-commands) for `fp` commands.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.