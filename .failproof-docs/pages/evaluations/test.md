> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Test an evaluation

> Run an evaluation against your real sessions before deploying it. Nothing is stored.

**test this evaluation**, on the authoring page, runs the code against real sessions of yours on the evaluator fleet without deploying it. Nothing is stored: a failure here is a preview, and deploying is always allowed.

**1. Check that it compiles**

Select **check** to compile the code and condition against the sandbox's rules without running them on any session.

**2. Pick sessions**

Narrow the matching sessions by agent, environment, time, or session id, and tick up to 10. Include sessions the evaluation should fail as well as ones it should pass.

**3. Run it**

Select **run against N sessions**, and read each row.

| Row | What it means |
| - | - |
| **ok** | It ran. The row lists every score, metric, and assertion it returned, and how long it took. |
| **skipped** | The condition returned `False`, so the evaluation did not run. That is a skip, not a failure. |
| Failed | It raised, timed out, or used something the sandbox refuses. The row says which, and **Fix it** hands the error to the assistant when it can help. |

![The test this evaluation panel: three sessions picked by agent, two ok and one skipped because its condition returned False.](https://mintcdn.com/exosphere/k_s8fY_jSxA_m1d_/images/dashboard/eval-test.png?fit=max\&auto=format\&n=k_s8fY_jSxA_m1d_\&q=85\&s=b7e36ddb791b5c612c485f2f86e0f36f)

A result stops being current the moment you edit the code; it is dimmed rather than reused.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.