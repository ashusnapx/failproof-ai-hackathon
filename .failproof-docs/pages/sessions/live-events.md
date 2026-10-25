> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Live events

> Watch agent activity arrive while a session is running.

Live events help you confirm instrumentation and watch a risky run without waiting for the session to finish.

## Watch activity

**Dashboard**

1. Go to **Observe → Events**.
2. Start with the current time window and no filters to confirm data is arriving.
3. Filter by environment, event type, agent, or session. Use search for payload text.
4. Select an event to inspect its summary and details. Follow its session link for the full trace.

   ![The live Events stream showing traffic from a Hermes chat gateway alongside coding-CLI runs, filtered by time, environment, event type, agent, model, context, and session.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/events-stream-current.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=e87ba86b877f602de73237d5a3565269)

**CLI**

```bash theme={null}
fp events --env production --event-type tool_use,error --limit 100
fp events --session-id <session-id> --order asc --all
fp --json events --full --session-id <session-id> --all
```

The default feed omits raw payloads. Use `--full` only for a bounded session investigation.

Use the event stream to answer three immediate questions:

* Is the expected agent reporting to the correct environment?
* Are model calls, tool calls, and policy decisions arriving in order?
* Has the session stopped making progress or started repeating an action?

Event types include agent lifecycle events, model requests and responses, tool use and results, hook execution, human waits and interrupts, and explicit errors. Correlation IDs join paired events such as a tool call and its result.

> [!TIP]
>
> Keep the live view broad while verifying a new integration. Add filters only after you see the first event; an incorrect filter can look like failed ingestion.

If no events appear, run `failproofai config --status`, then [troubleshoot ingestion](https://docs.befailproof.ai/reference/troubleshooting.md).

Agents that do not run in one of the 12 supported [harnesses](https://docs.befailproof.ai/reference/harnesses.md) report the same event types through the [Python SDK](https://docs.befailproof.ai/reference/custom-agents.md), including the human-in-the-loop events (`human_wait`, `human_input`, `human_interrupt`) that gateway and production agents depend on.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.