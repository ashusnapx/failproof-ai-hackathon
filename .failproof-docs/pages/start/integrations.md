> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Instrument your agent

> Connect any supported agent framework to Failproof AI with one call.

Your agent already produces everything worth recording — model calls, tool calls, node boundaries, human waits, failures. The framework throws it away. The SDK keeps it.

> **[Custom agents](https://docs.befailproof.ai/start/quickstarts/custom-agents.md)**
>
> An agent you wrote yourself, or one not listed here.

> **[LangChain and LangGraph](https://docs.befailproof.ai/start/quickstarts/langchain.md)**
>
> Graphs, nodes, tools, retrievers, models.

> **[CrewAI](https://docs.befailproof.ai/start/quickstarts/crewai.md)**
>
> Crews, flows, agents by role, tools.

> **[LlamaIndex](https://docs.befailproof.ai/start/quickstarts/llamaindex.md)**
>
> Workflows, steps, function agents, retrievers.

> **[Pydantic AI](https://docs.befailproof.ai/start/quickstarts/pydantic-ai.md)**
>
> Typed agents, capabilities, tools, retries.

## Three lines, whichever framework

```bash LangGraph theme={null}
pip install 'failproofai-sdk[langgraph]'
```

```bash CrewAI theme={null}
pip install 'failproofai-sdk[crewai]'
```

```bash LlamaIndex theme={null}
pip install 'failproofai-sdk[llamaindex]'
```

```bash Pydantic AI theme={null}
pip install 'failproofai-sdk[pydantic-ai]'
```

```bash Custom agents theme={null}
pip install failproofai-sdk
```

```python theme={null}
import failproofai_sdk

failproofai_sdk.configure(environment="production")
failproofai_sdk.instrument()          # detects the frameworks you imported

with failproofai_sdk.session():
    ...                               # your existing agent call, unchanged
```

No decorators on your functions, no callback passed to your calls, no ids threaded through your code. Only the call inside the session differs:

**LangGraph**

```python theme={null}
graph.invoke({"messages": [HumanMessage("...")]})
```

**CrewAI**

```python theme={null}
Crew(agents=[analyst, writer], tasks=[gather, summarise]).kickoff()
```

**LlamaIndex**

```python theme={null}
await agent.run("...")        # under `async with failproofai_sdk.session():`
```

**Pydantic AI**

```python theme={null}
agent.run_sync("...")
```

**Custom agents**

```python theme={null}
with failproofai_sdk.agent("planner"):
    with failproofai_sdk.tool_call("search", input={"q": q}) as t:
        t.output = search(q)
```

The extra installs the **framework**. Every adapter ships in the base wheel, so a project that already has its framework needs no extra at all.

## Check it arrived

Run one instrumented session, then open **Observe → Sessions** and select your environment. The run appears as a reconstructed trace.

If nothing arrives, confirm the machine is connected with `failproofai config --status`. See [Set up capture](https://docs.befailproof.ai/start/setup.md).

> [!WARNING]
>
> Do not check the spool directory to confirm delivery. The Failproof daemon collects and deletes each batch within milliseconds, so reading it races the collector and shows far fewer events than were emitted.

## Next

Each quickstart above links to its full guide — what gets recorded, options, streaming, span naming, and the problems people actually hit. They live under **Trace Agents → Plug in your agent**.

> **[How it works](https://docs.befailproof.ai/start/integrations/custom-agents.md#going-deeper)**
>
> The data model, the ids, the event types, and how events reach Cloud.

> **[Read a trace](https://docs.befailproof.ai/sessions/read-a-trace.md)**
>
> Follow causality through a session instead of disconnected logs.

> **[Find your first failure](https://docs.befailproof.ai/start/first-audit.md)**
>
> Audit the sessions you just captured.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.