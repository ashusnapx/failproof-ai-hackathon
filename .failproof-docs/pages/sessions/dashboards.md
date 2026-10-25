> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Dashboards

> Track the reliability signals that matter to an agent or workflow.

Dashboards combine saved queries into an operational view. Build one around a decision you expect someone to make—not around every available metric.

## Build a dashboard

**Dashboard**

1. Go to **Analyze → Queries**, create or open a saved query, and validate its result.
2. Select **add to dashboard**, then choose an existing dashboard or create one under **Analyze → Dashboards**.
3. Open the dashboard, enter edit mode, arrange tiles, and save the layout.
4. Return to the query when you need to change the data or filters behind a tile.

   ![A dashboard composed from saved queries for event volume, errors, latency, and model token use.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/dashboard-fleet.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=e41f4b6d3dfd830c2b448d360efaaeba)

**CLI**

Dashboard CRUD is not exposed by the current Cloud CLI. Use the CLI to build and verify the saved query, then add it to a dashboard in the UI.

```bash theme={null}
fp query schema
fp query create "production error rate" --sql "SELECT ..."
fp query run <query-id>
```

Useful dashboard groups include:

* **Models:** volume, latency, token use, error rate, and evaluation scores.
* **Evaluations:** success rate and score trends by agent or environment.
* **Tools:** call volume, failure rate, duration, and repeat calls.
* **Hooks and policies:** decisions, denials, and policy match rate.
* **Custom workflow metrics:** results from your own event fields and SQL.

Start with a saved query, validate its result, then add it as a tile. Keep production and development filters explicit so test traffic does not hide a regression.

> [!TIP]
>
> Give every dashboard an owner and a response question, such as “Is checkout-agent reliability worse than last week?”


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.