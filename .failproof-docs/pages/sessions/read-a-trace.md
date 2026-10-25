> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Read a trace

> Find the event that changed the course of an agent session.

A trace turns a flat event stream into the causal story of the run. Read it from the first divergence, not backward from the last error.

## Open the trace

**Dashboard**

1. Go to **Observe → Sessions** and open a session.
2. Use the profile summary to check outcome, timing, errors, and evaluation scores.
3. Scan the timeline and minimap. Filter event types or time when the session is large.
4. Select an event to inspect it. Use **export** for evaluator JSON, or copy the page URL to share a deep link to the selected evidence.

   ![A session detail view with its execution graph, event timeline, evaluation panel, and tool, model, and hook breakdown.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/session-detail.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=7b5f022dd5c485565a8cd92b2e936235)

**CLI**

```bash theme={null}
fp --json sessions --session-id <session-id>
fp events --session-id <session-id> --order asc --all
fp --json events --full --session-id <session-id> --all
```

Use the light event feed first. Request full payloads only when the event summaries do not contain enough evidence.

**1. Orient yourself**

Confirm the agent, environment, timing, outcome, and duration, then scan for errors, long spans, repeated tools, human waits, and denied policy decisions.

**2. Expand the first suspicious event**

Inspect its request, response, tool input, output, and correlation ID. Sensitive content is visible only when transcript capture is enabled and your permissions allow it.

**3. Inspect the preceding context**

The cause often sits one event earlier: an incorrect model response, missing tool result, or stale assumption.

**4. Turn the evidence into action**

Add the session to an audit scope, link it to an issue, or use the failure mode to author a policy.

> [!WARNING]
>
> Long duration does not always mean model latency. Separate model, tool, hook, and human-wait time before deciding what to fix.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.