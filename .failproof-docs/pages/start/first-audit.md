> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Run your first failure check

> Create an audit from the Cloud dashboard or the fp CLI and review its first findings.

An audit turns a set of sessions into ranked, evidence-backed failure findings. Start with one narrow failure question.

**Dashboard**

**1. Open Audits**

In the Cloud sidebar, go to **Analyze → Audits**. Select **new audit**.

**2. Set up the audit**

Enter a name and a direct failure goal, such as “find production sessions that retry the same failed payment call without changing input or escalating.” Select the agent, environment, time window, and schedule. Add a short brief and reference URLs when the auditor needs your workflow rules.

**3. Create and wait for the run**

Select **create audit**. The first run is queued immediately. Open the audit card to watch it move from queued to running to complete.

After the run completes, open a finding and review its session evidence. You can then acknowledge, assign, dismiss, mute, or resolve it.

![A completed audit finding showing its failure description, recommended action, supporting evidence, and affected sessions.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/audit-finding.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=7367cc69a28eab97133370f7458e6469)

**CLI**

```bash theme={null}
fp audits create payment-retry-failures \
  --description "Find production sessions that retry a failed payment call without changing input or escalating" \
  --scope '{"environments":["production"]}' \
  --text "Escalate after two unchanged payment failures"

fp audits list
fp audits runs payment-retry-failures
fp audits findings --audit payment-retry-failures
fp audits finding <finding-id>
```

Add reference context, then refresh it when the source changes:

```bash theme={null}
fp audits context-set payment-retry-failures --url https://example.com/payment-runbook
fp audits context-refresh payment-retry-failures
fp audits run payment-retry-failures
```

Use `fp audits ack <finding-id>`, `fp audits assign <finding-id> --to <email>`, `fp audits dismiss <finding-id>`, `fp audits mute <finding-id>`, `fp audits resolve <finding-id>`, or `fp audits reopen <finding-id>` to move a finding through triage.

Next, [prevent your first failure with a policy](https://docs.befailproof.ai/start/first-policy.md) for a confirmed repeatable action.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.