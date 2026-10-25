> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom agents

> Wrap your agent in three `with` blocks and it starts recording.

For an agent you wrote yourself, or a framework Failproof AI has no adapter for.

You wrap the work you already do in `with` blocks. Each one records when it started, when it finished, and how long it took — you do not call anything else.

## Install

```bash theme={null}
pip install failproofai-sdk
```

No extras, and no dependencies.

## Instrument

```python theme={null}
import failproofai_sdk

failproofai_sdk.configure(environment="production")

with failproofai_sdk.session():                 # one run
    with failproofai_sdk.agent("planner"):      # one unit of work
        with failproofai_sdk.tool_call("search", input={"q": q}) as t:
            t.output = search(q)                # one tool call
```

Read it top to bottom and it says what it means:

| Wrap it in | To say |
| - | - |
| `session()` | These events belong to the same run |
| `agent()` | Something is doing work — give it a name you would recognise in a list |
| `tool_call()` | This is one tool, and here is what it returned |

Nest them however your code nests. You never pass ids around: each block remembers what it is inside, so anything you record picks up the right run and the right agent on its own. `async with` works exactly the same.

## Check it arrived

Run it once, then open **Observe → Sessions** and select your environment. Your run appears as a reconstructed trace.

If nothing arrives, confirm the machine is connected with `failproofai config --status`.

> **[Full guide for custom agents](https://docs.befailproof.ai/start/integrations/custom-agents.md)**
>
> Every event method, what happens when your code raises, a worked example, threads and async, and instrumenting a framework with no adapter.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.