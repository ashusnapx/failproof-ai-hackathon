> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Jev evaluations

> Use Jev to score a finished session against a question with known answers.

A Jev evaluation reads a **finished session** and gives a score from 0 to 1. Use it when the answer is known in advance, such as “Did the customer express urgency?” or “How frustrated was the customer?” It helps you find patterns across runs; it does not stop a tool call. For decisions made **before** a tool runs, use [Jev policies](https://docs.befailproof.ai/policies/jev.md).

## Create one in the dashboard

1. Open **Analyze → eval authoring** and select **new eval**.
2. Describe one question and its possible answers. For example: “Did the agent promise a refund before checking the refund policy? Answer yes or no.” Select **draft** and review that the result is a classifier score.
3. [Test it](https://docs.befailproof.ai/evaluations/test.md) on recent sessions, then [deploy it](https://docs.befailproof.ai/evaluations/deploy.md). New completed sessions are scored; [backfill](https://docs.befailproof.ai/evaluations/deploy.md#score-sessions-you-already-have) if you also need history.

![The shared eval authoring form, where you describe a fixed-answer question, review the draft, and deploy after testing. The example shown is a code evaluation; a Jev question uses the same authoring flow.](https://mintcdn.com/exosphere/k_s8fY_jSxA_m1d_/images/dashboard/eval-authoring-draft.png?fit=max\&auto=format\&n=k_s8fY_jSxA_m1d_\&q=85\&s=7738fc3dd02d1e9b1792ce401a400149)

The assistant can choose between code, Jev classification, and a [judge](https://docs.befailproof.ai/evaluations/judge.md). Check its choice before deploying. Jev gives a score without prose reasoning; choose a judge when you need an explanation. See the [Jev evaluation reference](https://docs.befailproof.ai/reference/jev-evaluations.md) for question types and score limits.

## Read the scores

Open **Observe → Evaluations** to chart the result by agent and time. From a terminal, the Cloud CLI can read the same results:

```bash theme={null}
fp evals --since 7d
fp evals --aggregate --since 7d
```

The Cloud CLI reads results; authoring and deployment happen in the dashboard. See the [Cloud CLI reference](https://docs.befailproof.ai/reference/cloud-cli.md#evaluations) for filters.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.