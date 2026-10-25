# Failproof AI features × TruePe

Source: the offline docs in `.failproof-docs/` (llms-full.txt, pages/). Status: **used** = live in TruePe today, **next** = wired or one command away, **idea** = new use case not built.

| # | Failproof AI feature | Docs | TruePe use | Status |
|---|---|---|---|---|
| 1 | Hooks on 12 agent harnesses, 29 canonical events | reference/harnesses.md | Claude Code `PreToolUse` gates every `bin/pay` call before money moves | used |
| 2 | Custom policies (`customPolicies.add`, JS/TS) | reference/policy-sdk.md | 4 policies in `treasury/policies/treasury-policies.mjs` | used |
| 3 | Convention files `.failproofai/policies/*policies.mjs` | reference/policy-sdk.md | auto-loaded per project, no install step | used |
| 4 | Decisions `allow` / `deny` | policies/overview.md | deny with a reason the agent obeys ("report it to the human") | used |
| 5 | Decision `instruct` | reference/policy-sdk.md | warn the agent when a payout takes spend past 80% of the human budget | next |
| 6 | `PolicyContext.session.transcriptPath` | reference/policy-sdk.md | budget read from the human's own turns; tool output never authorizes | used |
| 7 | Hard policy authority (default) | policies/authority.md | money rules stay hard: Jev can never clear them | used |
| 8 | Always-on `block-failproofai-commands` + tamper guard on `.failproofai/` | skill + live | the agent cannot switch off its own payment guardrail (we hit this ourselves) | used |
| 9 | Fail-closed daemon | policies/failure-behavior.md | daemon down = no payout moves; safe default for money | used |
| 10 | Policy packs: `failproofai publish`, policy hub | policies/publish-a-pack.md | publish TruePe as the first payments pack (`category: "Payments"`, `defaultEnabled`) | next |
| 11 | Coding pack `FailproofAI/policies` (`sanitize-*`, `block-env-files`, `protect-env-vars`) | policies/packs.md | keep payment-gateway keys out of the agent's context next to TruePe | next (install hit GitHub rate limit) |
| 12 | Observe vs enforce | policies/deploy.md | our `mode.json` mirrors it locally: would-deny vs deny | used (local) |
| 13 | Cloud sessions, traces, live events | sessions/*.md | every AP run is traced to app.befailproof.ai through the connected daemon | used (auto) |
| 14 | Local dashboard (port 8020) Policies → Activity | reference/local-dashboard.md | every TruePe decision also lands in Failproof's own activity log | used (auto) |
| 15 | Jev semantic review (`FailproofAI/jev-policies`, 16 checks) | policies/jev.md | `external-data-egress` / `credential-exfiltration` on the same agent catch injection beyond payouts | idea |
| 16 | Cloud audits → findings → issues | audits/*.md | audit goal: "AP agent attempted a payee not in the vendor master" across all runs | idea |
| 17 | Evaluations (hosted Python, LLM judge, Jev eval) | evaluations/*.md | per-session "provenance score": share of payouts traceable to human words | idea |
| 18 | Alerts | audits/alerts.md | page the CFO when BEC denies recur for one vendor | idea |
| 19 | Fleet deploy / versions / rollback (`fp policies publish`, `fp fleet deploy …:observe`) | policies/deploy.md, rollback.md | roll TruePe out org-wide in observe, then enforce, roll back in one command | idea |
| 20 | `fp policies test` offline | policies/test.md | CI check that the BEC email stays denied | idea |
| 21 | Stop / SubagentStop gates | reference/policy-sdk.md | agent may not finish until it reported every blocked payout to the human | idea |
| 22 | SDK tracing for custom agents (Python/TS) | reference/custom-agents*.md | trace a non-harness payout bot; enforcement still needs a hook | idea |
| 23 | Pause (max 8 h) | skill | maintenance window without uninstalling | idea |
| 24 | Scoped API keys (`events:add`, `policies:pull`) | admin/keys-and-permissions.md | each finance machine gets a least-privilege key | idea |

## Combined use cases

- **Unswitchable treasury guard** (2 + 8 + 9): an agent that is prompt-injected cannot pay a fraudster, cannot edit the policy, cannot uninstall Failproof AI, and a dead daemon blocks instead of allowing.
- **Kill switch** (2 + 4 + 7): a human presses Freeze in the UI; `treasury-kill-switch` denies every payout, even in observe mode, mid-run.
- **Who said so?** (2 + 6): every rupee is matched against the human's own sentence in the session transcript.
- **Observe → enforce rollout** (12 + 19): week one logs what TruePe would block on real AP runs, week two enforces, rollback is one command.
- **Find → fix → prevent loop** (13 + 16 + 17 + 18 + 10): audits find payouts nobody approved, an evaluation scores provenance per run, alerts fire on repeats, and the fix ships as a pack.
