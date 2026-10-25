> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Tools

> Find slow, failing, or overused tools across agent sessions.

Tools groups tool calls across sessions so you can compare latency and call distribution.

**Dashboard**

1. Go to **Observe → Tools**.
2. Filter by environment, tool name, agent, or session ID.
3. Review latency and tool distribution.
4. Select a chart point or tool segment to open matching events and sessions.

   ![The Tools page showing latency, success and failure breakdowns, and tool-call distribution.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/tools.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=8c087403835bb48541611630499afa3e)

**CLI**

```bash theme={null}
fp list tools
fp events --event-type tool_use,tool_result --env production --since 24h
fp --json events --full --session-id <session-id> --all
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.