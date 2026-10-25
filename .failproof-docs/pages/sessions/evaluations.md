> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Read evaluation results

> Chart evaluation scores over time, compare agents and environments, see why a session scored low, and ask the assistant.

Results from every evaluation, hosted or from your own worker, land in the same places.

## Compare scores over time

**Dashboard**

Go to **Observe → evaluations**.

* **Recent runs** lists each evaluation as it lands: whether it came from a hosted (**managed**) or your own (**customer**) evaluator, the agent and session, the evaluation and its version, its status, and its score or metrics.
* **Score over time** plots what you ask for. Select **add series** and choose an agent, an environment, an evaluation, and a statistic: avg, min, max, p50, p75, p90, p95, p99, stddev, or mode. Each series is one line; give it its own **curve** to draw it on a separate chart.

  ![The evaluations page: recent runs tagged customer, a score over time chart with reference lines at 0.5 and 0.8, and one series averaging finished\_clean across all agents and environments.](https://mintcdn.com/exosphere/k_s8fY_jSxA_m1d_/images/dashboard/evaluations-chart.png?fit=max\&auto=format\&n=k_s8fY_jSxA_m1d_\&q=85\&s=e0faf3537d934ef5c6c7255aa5347f58)

One time range and one bin size apply to every series. A fine bin finds an incident; a coarse one shows a trend, and can hide the spikes you are looking for. A bucket where nothing was scored is a gap in the line, never a zero, and reference lines mark 0.5 and 0.8.

Every part of the view lives in the URL: **share** copies it, and whoever opens it sees exactly the comparison you built.

**CLI**

```bash theme={null}
fp evals --agent-id checkout-agent --aggregate
fp evals --aggregate --env production --status error
fp evals --score helpfulness:0.8.. --since 7d
```

Add global `--json` before `evals` for automation, for example `fp --json evals --aggregate --env production`.

Plot **avg** and **p90** for the same evaluation to see whether a good average is hiding a bad tail, or the same evaluation for two agents, or for production and staging, to compare them on one axis. Costs, latencies, and token counts, which carry units, chart under **Observe → metrics**, one chart per unit.

## See why a session scored low

Open a session from **Observe → sessions**; the grid carries each session's scores and filters by score range. The session's right rail leads with the evaluation summary, then a bar per score with the evaluator's reasoning under it.

![A session detail view showing evaluation scores and reasoning beside the complete trace.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/session-detail.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=7b5f022dd5c485565a8cd92b2e936235)

## Ask the assistant

Ask about evaluation data in plain English: "tell me about some of the recent evaluations", or which agents' scores are slipping. The [assistant](https://docs.befailproof.ai/sessions/assistant.md) reads and analyzes the results and answers with tables you can follow up on, and a question worth keeping can become a [query](https://docs.befailproof.ai/sessions/queries.md) or a [dashboard](https://docs.befailproof.ai/sessions/dashboards.md).

![The evaluations page beside the assistant, which answers "tell me about some of the recent evaluations" with a summary of totals, statuses, and scores.](https://mintcdn.com/exosphere/k_s8fY_jSxA_m1d_/images/dashboard/evaluations-assistant.png?fit=max\&auto=format\&n=k_s8fY_jSxA_m1d_\&q=85\&s=e819f1b1f9a1a091fb1cf35c576502ef)

## Watch and act

* **Dashboards**, under **Analyze → dashboards**, trend the scores you feature, per agent and environment, for the whole organization.

  ![A quality dashboard showing average evaluation scores and trends over time.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/dashboard-quality.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=74c925ae831046fc869a3a3d6e81fc25)

* **Alerts** notify you when a score crosses a threshold. See [alerts](https://docs.befailproof.ai/audits/alerts.md).

* When a score declines across many sessions, [run an audit](https://docs.befailproof.ai/audits/run.md) to find out why; when the cause is a repeatable action, [write a policy](https://docs.befailproof.ai/policies/editor.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.