> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Policy decisions

> See what policies evaluated, blocked, instructed, or allowed.

Policy decisions explains what enforcement did. Use it to verify a rollout, measure block rate, and find unguarded activity.

**Dashboard**

1. Go to **Observe → policy** and choose the time range and optionally one machine.
2. Review evaluated actions, blocks, block rate, Cloud decisions, unguarded actions, and activity while paused.
3. Filter the policy mapping table and inspect deployed assignments.
4. Select a chart point to open the decisions and their sessions.

   ![The Policy page showing decision totals, a machine filter, enforcement activity over time, and the policy mapping table.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/policy-observe.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=13535ad27c8bddac6589f9d1560916cb)

**CLI**

```bash theme={null}
fp events --event-type hook_completed --env production --since 24h
fp events --search "deny" --since 24h
failproofai config --status
```

Use `failproofai` for the machine's local enforcement state and `fp` for Cloud event investigation.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.