> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# LlamaIndex

> Install, instrument, and see your first trace.

Three steps to your first LlamaIndex trace. For workflow steps, retrieval, the reaper, and options, see [the full guide](https://docs.befailproof.ai/start/integrations/llamaindex.md).

## Install

```bash theme={null}
pip install 'failproofai-sdk[llamaindex]'
```

## Instrument

LlamaIndex's agent API is async. Every scope works under `async with` as well as `with`.

```python theme={null}
import asyncio

import failproofai_sdk

failproofai_sdk.configure(environment="production")
failproofai_sdk.instrument()


async def main():
    async with failproofai_sdk.session():
        await agent.run("...")


asyncio.run(main())
```

> [!WARNING]
>
> Without one extra argument on your LLM, every token count in your trace is null — `llama-index-llms-openai` does not request usage when it streams. See [Token counts](https://docs.befailproof.ai/start/integrations/llamaindex.md#token-counts).

## Check it arrived

Run it once, then open **Observe → Sessions** and select your environment. Your run appears as a reconstructed trace.

If nothing arrives, confirm the machine is connected with `failproofai config --status`.

> **[Full LlamaIndex guide](https://docs.befailproof.ai/start/integrations/llamaindex.md)**
>
> Token counts, what gets recorded, workflow steps, retrieval, options, and common problems.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.