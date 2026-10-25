> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Hooks

> Measure hook activity, triggers, and latency separately from policy outcomes.

Hooks shows when agent lifecycle hooks run and how long they take. Policy decisions are a separate view.

**Dashboard**

1. Go to **Observe → Hooks**.
2. Filter by environment, hook name, trigger event, agent, or session ID.
3. Review hook latency and distribution.
4. Select a chart point or hook segment to open the underlying events.

   ![The Hooks page showing latency grouped by hook name and trigger event.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/hooks.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=08837c16615a3a573cdcbcfd806a364a)

**CLI**

```bash theme={null}
fp list hooks
fp events --event-type hook_triggered,hook_completed --env production --since 24h
fp events --search "PreToolUse" --since 24h
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.