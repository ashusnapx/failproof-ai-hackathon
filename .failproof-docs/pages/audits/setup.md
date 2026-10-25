> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Set up an audit

> Define an audit goal, session population, and evidence context.

The quality of an audit starts with its scope. A broad request such as “find problems” produces less useful results than a concrete failure question.

## Configure the audit

**Dashboard**

1. Go to **Analyze → Audits → New audit** and enter the name and description.
2. Set the cadence, time window, agent/environment scope, ignored errors, sensitivity, and maximum findings.
3. In **agents**, add or review agent context, then add the operator brief and any public HTTPS reference URLs.
4. Choose notification channels and select **create audit**. The first run queues immediately.

   ![The new audit form with name, description, cadence, window, environment and agent scope, ignored errors, analysis settings, brief, reference pages, and notification channels.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/audit-new.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=5ff2eacb3773c1acd30535a8395e5603)

**CLI**

```bash theme={null}
fp audits create checkout-reliability \
  --description "Find checkout failures that agents do not recover from" \
  --scope '{"environments":["production"],"agent_ids":["checkout-agent"]}' \
  --schedule-interval-secs 86400 \
  --window-mode since_last \
  --sensitivity medium \
  --text-file ./checkout-audit-brief.txt \
  --url https://runbooks.example.com/checkout
```

The first run queues immediately. Include the brief and reference URLs during creation so that run receives them.

See the complete [`fp audits create` reference](https://docs.befailproof.ai/reference/cloud-cli#audits).

> [!TIP]
>
> Start with a known failed session and several normal sessions. This gives the audit both a positive example and a comparison set.

> [!NOTE]
>
> Audit context is stored as its own resource so editing an audit does not accidentally remove the reference material.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.