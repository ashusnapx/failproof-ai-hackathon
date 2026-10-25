> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Use Jev

> Set up Jev evaluations for finished sessions or Jev policies for live tool-call review.

Jev helps at two points in an agent run: score a finished session against known answers, or review a tool call in the context of what you asked the agent to do.

**Jev evals**

Use a Jev eval when a finished session can be scored against a question with a few known answers, such as “Did the customer ask for a refund? Answer yes or no.” It helps you find patterns across sessions.

## Create an eval

In the Cloud dashboard, open **Analyze → eval authoring → new eval**. Enter one fixed-answer question, select **draft**, and check that it chose a classifier score. [Test it](https://docs.befailproof.ai/evaluations/test.md) on real sessions, then deploy it.

![The shared eval authoring form where you describe a question, review the draft, and deploy it. This screenshot shows a code draft; use a fixed-answer question for Jev.](https://mintcdn.com/exosphere/k_s8fY_jSxA_m1d_/images/dashboard/eval-authoring-draft.png?fit=max\&auto=format\&n=k_s8fY_jSxA_m1d_\&q=85\&s=7738fc3dd02d1e9b1792ce401a400149)

## Read the scores

After a new session completes, open **Observe → Evaluations** or use the Cloud CLI:

```bash theme={null}
fp evals --since 7d
fp evals --aggregate --since 7d
```

The CLI reads scores; creating a Jev eval currently uses the dashboard. See [Jev evaluations](https://docs.befailproof.ai/evaluations/jev.md) for question types and examples.

**Jev policies**

Use Jev policy review when a string-matching policy needs the context of your request to decide whether a tool call is safe. Start in **observe** mode so you can inspect Jev's answers while your installed policies still decide each call.

Jev's checks come from a pack; Failproof AI ships none. Until you install them, Jev asks nothing, even when it is configured:

```bash theme={null}
failproofai policies add FailproofAI/jev-policies
```

## Set up Cloud Jev

In the Cloud dashboard, open **Administration → Keys** and create a key with the **machine** preset. Use it with `failproofai config` as shown in the [quickstart](https://docs.befailproof.ai/start/quickstart.md). On a machine without an existing Jev configuration, this enables Cloud Jev in observe mode. Check the connection with:

```bash theme={null}
failproofai jev status
failproofai jev test
```

## Use your own endpoint

In the local dashboard, open **Settings → Jev**. Choose the provider, paste its token, select **observe**, and turn Jev on.

![The local Jev settings panel with a provider, token field, and observe mode selected.](https://mintcdn.com/exosphere/iOjAK1F5HjkAlttv/images/dashboard/jev-settings.png?fit=max\&auto=format\&n=iOjAK1F5HjkAlttv\&q=85\&s=cdfbae016b662739a213d9507fdfbd43)

Or configure and test your endpoint from a terminal:

```bash theme={null}
failproofai jev --url https://api.typesafe.ai/v1 --mode observe --key-stdin < ~/typesafe.key
failproofai jev test
```

Ask a hooked agent to use its file-reading tool on `README.md`. Confirm that tool call appears in the session, then inspect it under **Policies → Activity** in the local dashboard. Once the observe results look right, [Jev policies](https://docs.befailproof.ai/policies/jev.md) explains when to enforce. For provider details and configuration, see the [integration reference](https://docs.befailproof.ai/reference/jev.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.