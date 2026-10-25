> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Models

> Compare model latency, tokens, context use, and traffic distribution.

Use Models to see whether reliability or cost changed with a model, agent, environment, or time range.

**Dashboard**

1. Go to **Observe → Models**.
2. Set the time range, then filter by environment, model, agent, or session ID.
3. Review latency, token consumption, context-window use, and model distribution.
4. Select a chart point or distribution segment to open the matching events.

   ![The Models page showing latency, percentile, token, cost, context-window, and model-distribution views.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/models.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=db49dfc29def4a8418110c9ea4b67afc)

**CLI**

```bash theme={null}
fp list models
fp events --event-type model_request,model_response --env production --since 24h
fp --json events --fields ts,agent_id,session_id,event_type,output_tokens,context_fill
```

Use a saved query for model-level aggregates that are not exposed as a dedicated CLI command.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.