> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Metrics

> Plot magnitude metrics such as latency, cost, and token use.

Metrics is for values with units. Evaluations is for scores and judgments.

**Dashboard**

1. Go to **Observe → Metrics**.
2. Select **add series** and choose an agent, environment, metric, statistic, and curve.
3. Add series to compare agents or environments; different units receive separate axes.
4. Select a point to open matching evaluations and sessions, or select **share** to copy the exact view.

   ![The Metrics page comparing two cost-per-output-unit series with time controls, aggregation selectors, curves, and a share action.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/metrics-series.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=51c4ec844bb910c32b589085a967e6b2)

**CLI**

There is no dedicated magnitude-metrics command yet. Discover available keys and inspect sessions or evaluations:

```bash theme={null}
fp list score_filters
fp --json evals --since 24h
fp --json sessions --since 24h
```

Use `fp query` for custom metric aggregation.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.