> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# CrewAI

> Install, instrument, and see your first trace.

Three steps to your first CrewAI trace. For what each event carries, flows, and troubleshooting, see [the full guide](https://docs.befailproof.ai/start/integrations/crewai.md).

## Install

```bash theme={null}
pip install 'failproofai-sdk[crewai]'
```

## Instrument

```python theme={null}
import failproofai_sdk

failproofai_sdk.configure(environment="production")
failproofai_sdk.instrument()

with failproofai_sdk.session():
    Crew(agents=[analyst, writer], tasks=[gather, summarise]).kickoff()
```

Nothing about your crew, agents, tasks, or tools changes. `instrument()` subscribes to CrewAI's module-level event bus.

## Check it arrived

Run it once, then open **Observe → Sessions** and select your environment. Your run appears as a reconstructed trace.

If nothing arrives, confirm the machine is connected with `failproofai config --status`.

> **[Full CrewAI guide](https://docs.befailproof.ai/start/integrations/crewai.md)**
>
> What gets recorded, flows, token usage, span naming, options, and common problems.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.