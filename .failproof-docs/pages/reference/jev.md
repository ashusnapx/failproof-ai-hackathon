> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Jev integration reference

> Configuration, providers, keys, request data, and failure behavior for Jev.

Jev has two uses in Failproof AI:

| Use | When it runs | What it returns | Start here |
| - | - | - | - |
| Session evaluation | After a session finishes | A score for a fixed-answer question | [Jev evaluations](https://docs.befailproof.ai/evaluations/jev.md) |
| Tool-call policy review | Before a gated tool call runs | A verdict alongside the installed policies | [Jev policies](https://docs.befailproof.ai/policies/jev.md) |

## Reference pages

| Topic | Details |
| - | - |
| [Evaluation questions](https://docs.befailproof.ai/reference/jev-evaluations.md) | Boolean and ordered-score criteria, results, limits, and backfill. |
| [Provider comparison and own-key setup](https://docs.befailproof.ai/reference/jev-providers.md) | TypeSafe, OpenRouter, Vercel, Cloudflare, and custom endpoints; URL inference, model IDs, `jev.json`, modes, and fallback codes. |
| [FailproofAI Cloud route](https://docs.befailproof.ai/reference/jev-cloud.md) | Machine-key permissions, automatic observe setup, usage limits, connection state, and data handling. |

The local CLI commands are listed in the [Failproof AI CLI reference](https://docs.befailproof.ai/reference/failproof-cli.md). The [local dashboard reference](https://docs.befailproof.ai/reference/local-dashboard.md#set-up-jev) describes its Jev settings and activity view.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.