> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Pydantic AI

> Install, instrument, and see your first trace.

Three steps to your first Pydantic AI trace. For tools, retries, streaming, and options, see [the full guide](https://docs.befailproof.ai/start/integrations/pydantic-ai.md).

## Install

```bash theme={null}
pip install 'failproofai-sdk[pydantic-ai]'
```

## Instrument

```python theme={null}
import failproofai_sdk
from pydantic_ai import Agent

failproofai_sdk.configure(environment="production")
failproofai_sdk.instrument()          # before constructing any Agent

agent = Agent("openai:gpt-4o-mini", system_prompt="Be terse.")

with failproofai_sdk.session():
    result = agent.run_sync("...")
```

> [!WARNING]
>
> `instrument()` must run **before** you construct an `Agent`. The capability is appended at construction, so an agent built earlier records nothing — with no error, because nothing went wrong. This is the most common cause of an empty trace with this adapter, and module-scope agents are where it bites: import `failproofai_sdk` and call `instrument()` before importing the module that builds them.

## Check it arrived

Run it once, then open **Observe → Sessions** and select your environment. Your run appears as a reconstructed trace.

If nothing arrives, confirm the machine is connected with `failproofai config --status`.

> **[Full Pydantic AI guide](https://docs.befailproof.ai/start/integrations/pydantic-ai.md)**
>
> What gets recorded, tools and retries, streaming, span naming, options, and common problems.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.