> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Usage

> Inspect organization consumption and the active billing window.

Usage shows consumption for the current organization and its billing windows. Use it to understand how production rollout, transcript volume, evaluations, and audit cadence affect your plan.

## Review usage

**Dashboard**

1. Go to **Administration → Usage**.
2. Confirm the organization and metering window.
3. Review ingest, sessions, evaluations, metrics, audits, findings, alerts, users, and keys.
4. Compare started and completed audit work when audit usage looks unexpected.

   ![The Usage page showing the metering window, captured events, evaluation and audit pipelines, workspace resources, members, and API keys.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/usage-overview.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=418245c4423887780fbc068913c93f01)

**CLI**

```bash theme={null}
fp usage
fp --json usage
fp --org reliability-team --json usage
```

## Investigate a change

1. Confirm the active organization and window.
2. Compare the increase with session volume by environment.
3. Check whether a new integration started sending transcripts.
4. Review evaluator and audit cadence changes.
5. Compare against the limits on the current pricing plan.

The CLI returns the same summary for scripts.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.