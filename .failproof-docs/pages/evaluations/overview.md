> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Evaluate agents

> Score every finished session with evaluations you define: hosted Python checks, or LLM judges in your own worker.

An evaluation scores a finished agent session. When a session ends, every enabled evaluation that applies to it runs and records what it found, with reasoning you can read beside the trace:

* a **score** from 0 to 1, optionally marked passed or failed
* a **metric**, such as a count, a duration, or a cost, with its unit
* an **assertion**, which passed or did not

## Two kinds of evaluator

| | Hosted Python | Your own worker |
| - | - | - |
| Written | In the dashboard, under **Analyze → eval authoring** | In Python, with the [Evaluator SDK](https://docs.befailproof.ai/reference/evaluator-sdk.md) |
| Runs | On Failproof AI's managed evaluator, in a sandbox | On your infrastructure |
| Best for | Deterministic checks, and model-backed ones we host for you | Packages, secrets, your own network, models you host yourself, heavy processing |

Hosted evaluations come in three shapes, and the assistant picks between them for you:

| | Reads the session with | Gives you |
| - | - | - |
| **Code** | nothing — one Python expression, no imports, no network | a score, a metric, or an assertion |
| **[Jev classifier](https://docs.befailproof.ai/evaluations/jev.md)** | a small model built for classification | a score, and nothing else — it does not explain itself |
| **[Judge](https://docs.befailproof.ai/evaluations/judge.md)** | a general-purpose model | a score **and** the reasoning behind it |

Code costs nothing to run. The other two cost a model call per session, so give them a condition that narrows them to the sessions the question is actually about.

Your own worker is still where an evaluation goes when it needs something we do not host: a package, a secret, your own network, or a model you run yourself. Neither kind needs an inbound connection: workers claim finished sessions and submit results over outbound HTTPS.

## Each organization evaluates its own agents

Evaluations belong to the organization that defines them. Each organization on an instance writes its own — its own checks, conditions, thresholds, and labels — versions and deploys them without affecting any other, and sees only its own results. Filter those results by agent, environment, evaluation, and time, or ask the assistant about them.

## From first draft to live scores

**1. Write it**

Describe what to measure and let the assistant draft it, or write it yourself. See [Write an evaluation](https://docs.befailproof.ai/evaluations/write.md).

**2. Test it**

Run it against real sessions before it goes live; nothing is stored. See [Test an evaluation](https://docs.befailproof.ai/evaluations/test.md).

**3. Deploy and version it**

Deploy an immutable version, publish new ones as it evolves, and roll back to an earlier one. See [Deploy and version](https://docs.befailproof.ai/evaluations/deploy.md).

**4. Read the results**

Chart scores over time, compare agents and environments, and ask the assistant. See [Read evaluation results](https://docs.befailproof.ai/sessions/evaluations.md).

Evaluation runs forward: a version deployed now scores the sessions that finish from now on. To score sessions you already have, [backfill them](https://docs.befailproof.ai/evaluations/deploy.md#score-sessions-you-already-have).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.