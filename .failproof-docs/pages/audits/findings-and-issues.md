> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Findings and issues

> Turn audit evidence into owned, trackable remediation work.

A finding is the audit's evidence-backed statement about a failure. An issue is the durable workflow for responding to it.

## Triage and assign the work

**Dashboard**

1. Open **Analyze → Audits**, choose a completed run, and select a finding to inspect its analysis, recommendation, sessions, and evidence queries.
2. Acknowledge, assign, dismiss, mute, resolve, or reopen the finding after checking its evidence.
3. Go to **Analyze → Issues** and filter the durable inbox by status, severity, or assignee.
4. Open the issue to assign it, add comments or subscribers, and resolve it after the fix is verified.

Start with the finding summary. Confirm that the failure description, recommended response, severity, and ranking agree with the sessions you expected the audit to examine.

![An audit finding with severity, occurrence count, root-cause analysis, recommended action, ranking factors, and evidence.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/audit-finding.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=7367cc69a28eab97133370f7458e6469)

Next, open an affected session rather than deciding from the summary alone. The linked trace should show the exact event and payload that support the finding.

![A session linked from an audit finding, opened at the relevant error with its event metadata and raw payload.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/audit-linked-session.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=ecb3c4663deec816043e011f4052b5ad)

After verifying the evidence, use Issues to give the response an owner and track it independently of future audit runs.

![The Issues inbox showing firing, acknowledged, and resolved work with severity and ownership.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/incidents.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=ba75932dba571917854ba0aa900eb5c2)

Open the issue to record investigation notes, notify subscribers, and preserve the response history. Resolve it only after the remediation is deployed and verified.

![An issue detail view with its source, breach evidence, assignees, subscribers, timeline, and comments.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/incident-detail.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=c62a1ca06de396a70992466f6925c61a)

**CLI**

```bash theme={null}
fp audits findings --audit checkout-reliability --status open
fp audits finding <finding-id>
fp audits ack <finding-id> --reason "owner assigned"
fp audits assign <finding-id> --to engineer@example.com

fp issues list
fp issues show <issue-id>
fp issues assign <issue-id> --assignee engineer@example.com
fp issues comment-add <issue-id> --body "policy is in observe mode"
fp issues resolve <issue-id> --yes
fp issues close <issue-id> --yes
fp issues archive <issue-id>
```

Use `fp issues subscribe <issue-id>`, `fp issues unsubscribe <issue-id>`, and `fp issues subscribers <issue-id>` to manage watchers.

See the [Cloud CLI audit and issue reference](https://docs.befailproof.ai/reference/cloud-cli.md#audits) for audit findings and [`fp issues`](https://docs.befailproof.ai/reference/cloud-cli#issues) for issue management.

## Review a finding

Confirm that it contains:

* A stable failure mode, not only a one-off title
* Severity and operational impact
* Affected session IDs or supporting queries
* Enough context to reproduce the behavior
* A proposed response that matches the evidence

## Use an issue to manage the response

Create or link an issue when the finding needs assignment, discussion, status changes, comments, or subscribers. Issues can also represent alert incidents and manually reported problems, which is why they live under audit response rather than in the primary navigation.

Resolve the issue when remediation is deployed and verified. Resolve the finding when the failure mode has been addressed for the audit population. Those moments may differ.

## End an issue: resolve, close, or archive

An issue ends once, and how you end it decides what happens the next time the audit
sees the same pattern.

| Action | Means | If the pattern comes back |
| - | - | - |
| **Resolve** | You fixed it. | The issue **reopens**, so you find out the fix did not hold. |
| **Close** | You are done with it: won't fix, not a problem, or no longer relevant. | It **stays closed**. |
| **Archive** | Take it off the board. Says nothing about how it ended. | A live issue returns to the board automatically. |

Resolve and close are both final and neither can overwrite the other, so an issue
someone resolved keeps that record. Archiving is separate from both: you can archive
an issue in any state, and it keeps whatever state it ended in. If an archived issue
is still live and the problem recurs, it comes back to the board on its own — archive
hides history, it cannot hide an active problem.

Closing an issue that came from an audit also dismisses the finding behind it. It
does not silence that pattern in your other audits; for that, mute or dismiss the
finding itself.

## Start fresh after changing your agents

When you ship a round of changes to your agents, the issues already on the board
describe the behavior you just replaced. Clearing resolves them in one step, along
with the audit findings behind them.

**Dashboard**

1. Go to **Analyze → Issues** and select **clear**, or open a single audit and select **clear issues** to limit it to that audit's work.
2. Choose the scope. Each one shows how many issues it covers before you commit to it.
3. Confirm. The issues are resolved, and so are the audit findings behind them.

**CLI**

```bash theme={null}
fp issues clear --all-audits --dry-run
fp issues clear --all-audits --yes

fp issues clear --audit <audit-id> --yes
fp issues clear --everything --yes
```

`--dry-run` reports what would change without changing it. Exactly one of
`--audit`, `--all-audits`, and `--everything` is required.

**Clearing suppresses nothing.** A pattern your changes genuinely fixed stays gone. A
pattern that survived them **reopens** its issue on the next audit run — the same thing
resolving one by hand does — so a fresh start cannot quietly hide a problem you still
have. When you do want a pattern
silenced for good, mute or dismiss the finding instead.

Clearing needs permission to both close issues and write audits, because it resolves
the findings as well as the issues.

## Turn an issue into a policy draft

**Dashboard**

1. Open the issue and verify its finding, cited sessions, root cause, and recommendation.
2. Select **generate policy** and review the candidacy result and proposed enforcement intent. A **no policy** result means the behavior may require an alert, workflow change, or human response instead.
3. Select **write this policy**, then review and test the generated source in **Admin → policy editor** before selecting **publish version**. Use **open the editor anyway** when you disagree with the candidacy check.
4. Go to **Admin → enforcement**, deploy the version in **observe** mode, and verify its decisions under **Observe → policy** before enforcing it.

The issue title, finding description, root cause, recommendation, and candidacy intent help compose the draft. Nothing is published or deployed automatically.

**CLI**

Use the CLI to inspect the evidence before opening the issue in the dashboard:

```bash theme={null}
fp issues show <issue-id>
fp audits finding <finding-id>
fp events --session-id <session-id> --full --all
```

Policy candidacy, Cloud publication, and fleet deployment are dashboard workflows. Use `failproofai policies --install --custom <file>` when you want to validate equivalent policy source locally first.

> **[Author a policy](https://docs.befailproof.ai/policies/editor.md)**
>
> Convert a confirmed, repeatable action pattern into a policy version.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.