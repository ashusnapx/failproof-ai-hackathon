> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# LangChain and LangGraph

> Install, instrument, and see your first trace.

Three steps to your first LangChain or LangGraph trace. For streaming, human-in-the-loop, span naming, and options, see [the full guide](https://docs.befailproof.ai/start/integrations/langchain.md).

## Install

```bash theme={null}
pip install 'failproofai-sdk[langgraph]'
```

For LangChain without LangGraph, use `failproofai-sdk[langchain]`.

## Instrument

```python theme={null}
import failproofai_sdk

failproofai_sdk.configure(environment="production")
failproofai_sdk.instrument()

with failproofai_sdk.session():
    graph.invoke({"messages": [HumanMessage("...")]})
```

No call site changes. `instrument()` registers a tracer that LangChain injects into every callback manager it builds, so graphs, tools, and models are captured — including ones inside libraries you did not write.

## Check it arrived

Run it once, then open **Observe → Sessions** and select your environment. Your run appears as a reconstructed trace.

If nothing arrives, confirm the machine is connected with `failproofai config --status`.

> **[Full LangChain guide](https://docs.befailproof.ai/start/integrations/langchain.md)**
>
> What gets recorded, streaming, token counts, span naming, session control, options, and human in the loop.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.