> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Audit recipes

> Starting goals for common agent failure investigations.

Use these as starting goals, then add your agent, environment, and expected workflow.

**Dashboard**

Go to **Analyze → Audits → New audit**, copy one recipe into the description or brief, then add the relevant environment, agent, lookback, and reference URLs. Create the audit and inspect the first run before scheduling it.

The new audit form turns a recipe into an executable failure check by adding scope, context, cadence, and notifications.

![The new audit form configured with a focused goal, schedule, agent and environment scope, context, and notification channels.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/audit-new.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=5ff2eacb3773c1acd30535a8395e5603)

After creation, confirm the audit appears in the list with the expected status and schedule before relying on recurring runs.

![The Audits page where a workflow-specific audit recipe appears after creation.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/audits.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=de22007bf3f5cd8e1f6eb5a72de5bbfc)

Open the first run and refine the recipe if its findings are broader or narrower than the intended failure mode.

**CLI**

Save a recipe as a text file and attach it during creation:

```bash theme={null}
fp audits create retry-loop-review \
  --scope '{"environments":["production"]}' \
  --text-file ./retry-loop-audit.txt \
  --schedule-interval-secs 86400
```

> **Repeated retry loops**
>
> Find sessions where the agent repeats the same failing tool call without changing input, selecting an alternative tool, or escalating to a human.

> **Incorrect tool use**
>
> Find sessions where the chosen tool does not match the stated task, or where tool input violates the workflow's required preconditions.

> **Unsafe data access**
>
> Find sessions that read, write, or transmit sensitive data outside the approved paths and services for this agent.

> **Task abandonment**
>
> Find sessions that end without the requested outcome, a clear error, or an explicit handoff to a human.

> **Cost or latency regression**
>
> Find sessions whose model, tool, or total duration exceeds the expected budget, and identify the event pattern responsible.

> **Missed human escalation**
>
> Find sessions where confidence, repeated failure, or policy guidance required a human decision but the agent continued autonomously.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.