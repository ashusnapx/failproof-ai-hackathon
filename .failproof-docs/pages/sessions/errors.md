> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Errors

> Group repeated errors and open the sessions behind them.

Errors gives you a failure-first view across sessions. Group by error type, agent, environment, model, tool, or time window to find repeated operational problems.

## Investigate errors

**Dashboard**

1. Go to **Observe → Errors**.
2. Filter by environment, event type, error type, agent, session ID, or search text.
3. Expand a grouped error to see occurrences. Select a row to open the exact event in its session.
4. Select the bell control on a representative error to start an alert for similar errors.

   ![The Errors page showing a failure histogram, grouped errors, and the control for creating an alert.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/errors.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=fb6973d5708bcd6be0dc5a887450dec0)

**CLI**

```bash theme={null}
fp errors --env production --since 24h
fp errors --error-type TimeoutError --agent-id checkout-agent
fp errors --aggregate --env production --since 7d
```

Use `fp events --full --session-id <id>` when you need the raw payload behind an error summary.

## Use Errors when you need to

* Find the most frequent error class in production.
* Determine whether one tool or model causes a spike.
* Jump from an aggregate count to representative sessions.
* Create an alert for recurrence.
* Include the affected population in an audit.

An error is an observed event. A failed evaluation is a quality judgment, and an audit finding is an investigated failure pattern. Keep those distinctions when deciding which response workflow to use.

> **[Create an alert](https://docs.befailproof.ai/audits/alerts.md)**
>
> Notify responders when an error or quality condition crosses a threshold.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.