> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Troubleshooting

> Diagnose missing sessions, missing policies, failed delivery, and blocked agent actions.

> **No sessions appear in Cloud**
>
> **Dashboard**
>
> Open **Administration → Keys** and confirm the machine key is active and has `events:add`. Then open **Observe → Events**, widen the time range, and clear environment and agent filters. If events exist, search the session ID and then check **Observe → Sessions** for grouping. If no events exist, diagnose the Failproof daemon from the CLI.
>
> ![The live Events stream with its primary filters visible and recent agent events arriving.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/events-stream-current.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=e87ba86b877f602de73237d5a3565269)
>
> **CLI**
>
> ```bash theme={null}
> failproofai config --status
> failproofai flush --wait --timeout 60
> fp list envs
> fp events --since 24h --limit 20
> fp sessions --since 24h --limit 20
> ```
>
> Confirm capture is enabled, the configured key has `events:add`, and the dashboard filter matches the emitted environment.

> **Python SDK events remain on disk**
>
> **Dashboard**
>
> Clear filters in **Observe → Events** and search the exact SDK session ID. If nothing appears, inspect the SDK spool and Failproof daemon on the source machine.
>
> **CLI**
>
> ```bash theme={null}
> failproofai config --status
> failproofai flush --wait
> ```
>
> Confirm a daemon is running and connected — the SDK spools whether or not one is. The spool directory does **not** need to pre-exist (the writer creates it), and no environment variable selects it: `$FAILPROOFAI_HOME/custom-agents`, otherwise `~/.failproofai/custom-agents`, is the only root, and `configure(base_dir=...)` is the only override. If the process was `SIGKILL`ed or OOM-killed, whatever was still queued was lost — handle `SIGTERM` to bound that.

> **The machine does not receive policies**
>
> **Dashboard**
>
> Open **Admin → enforcement**, select the machine, and compare its assigned, reported, and previous versions. Confirm the deployment scope includes the machine and its key has `policies:pull`. Ingest can work even when policy delivery does not.
>
> **CLI**
>
> ```bash theme={null}
> failproofai config --status
> failproofai update
> failproofai config --status
> ```
>
> Confirm the machine ID and label match the dashboard target. Reconnect with a policy-capable key if the existing credential only grants event ingestion.

> **A self-hosted Cloud with a private certificate authority gets no events or policies**
>
> **Dashboard**
>
> The machine connected and its hooks work, but **Observe → Events** stays empty and **Admin → enforcement** never shows its deployment as applied. The CLI and the Failproof daemon trust certificates differently. The CLI runs on Node and honours `NODE_EXTRA_CA_CERTS`. `failproofaid`, which sends events and pulls policies, trusts the certificates bundled with it plus the operating system's trust store, and ignores `NODE_EXTRA_CA_CERTS`. Install your CA in the system store on the machine.
>
> **CLI**
>
> ```bash theme={null}
> # Debian / Ubuntu
> sudo cp company-ca.pem /usr/local/share/ca-certificates/company-ca.crt
> sudo update-ca-certificates
> # RHEL / Fedora
> sudo cp company-ca.pem /etc/pki/ca-trust/source/anchors/ && sudo update-ca-trust
> # macOS
> sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain company-ca.pem
>
> # then restart the daemon, which loads trusted certificates at start
> sudo systemctl restart failproofaid@$USER                           # Linux
> sudo launchctl kickstart -k system/ai.failproof.failproofaid.$USER  # macOS
> ```
>
> The daemon's log names the cause: `sudo journalctl -u failproofaid@$USER | grep UnknownIssuer` on Linux. `SSL_CERT_FILE` or `SSL_CERT_DIR` in the service's environment replaces the system store for the daemon, and the bundled certificates still apply. Batches that failed while the CA was untrusted are kept in `~/.failproofai/state/failed` and retried automatically, about hourly and when the daemon restarts.

> **An action is denied because the daemon is unavailable**
>
> **Dashboard**
>
> Open **Admin → enforcement** and inspect the machine's last-seen time and reported version. If the machine is stale, treat this as a local daemon problem. Do not weaken the deployed policy solely to bypass an unavailable daemon.
>
> **CLI**
>
> ```bash theme={null}
> failproofai config --status
> failproofai update
> failproofai config
> failproofai config --status
> ```
>
> Restart or update `failproofaid`; rerun configuration when the CLI and daemon protocol versions differ. The configured daemon path fails closed by design.

> **A custom policy does not load**
>
> **Dashboard**
>
> For a Cloud-authored policy, open **Admin → policy editor**, select the draft, and review validation errors before publishing. For a local policy, use the CLI to validate it, then open **Observe → policy** after a test action to confirm decisions arrive.
>
> **CLI**
>
> Confirm the filename ends in `policies.js`, `policies.mjs`, or `policies.ts`, the module calls `customPolicies.add(...)`, and imports resolve from the policy file.
>
> ```bash theme={null}
> failproofai policies --install --custom ./checkout.policies.ts
> failproofai policies
> ```

> **An audit returns no findings**
>
> **Dashboard**
>
> Open **Analyze → audits**, select the run, and check whether model analysis ran. Then compare its scope and window with **Observe → sessions** and open representative traces from that population.
>
> A zero result is meaningful only when analysis ran successfully. If analysis was skipped or failed, the run produces no findings and keeps the unanalysed window open for a future successful run. If model analysis is disabled, the audit also produces no findings because the deterministic credential and PII scan records statistics but no longer raises findings.
>
> ![The audit form where environment, agent, cadence, and sweep window define the session population.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/audit-new.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=5ff2eacb3773c1acd30535a8395e5603)
>
> **CLI**
>
> ```bash theme={null}
> fp audits show <audit-name>
> fp audits runs <audit-name>
> fp sessions --since 24h --env production
> fp audits context-show <audit-name>
> fp audits run <audit-name>
> fp audits findings --audit <audit-name>
> ```
>
> If the run stayed queued, wait for audit-agent capacity or ask the deployment operator to inspect the audit fleet. A queued audit retries; it is not immediately skipped.

> **Online evaluations do not run automatically**
>
> **Dashboard**
>
> Open a completed session and check whether a manual evaluation succeeds. Hosted Cloud currently has no evaluator endpoint control in the dashboard; the server operator must configure it.
>
> **CLI**
>
> Verify the evaluator itself, then inspect recent evaluation states:
>
> ```bash theme={null}
> curl https://evaluator.example.com/health
> fp evals --since 1h
> ```
>
> On self-hosted Cloud, confirm `EVALUATOR_ENDPOINT` is present on the server and `EVALUATOR_TOKEN` matches the evaluator. Automatic evaluation is disabled when the endpoint is absent.

> **Cloud CLI authentication targets the wrong organization**
>
> **Dashboard**
>
> Use the organization switcher and confirm the expected slug and permissions before comparing results with the CLI.
>
> **CLI**
>
> ```bash theme={null}
> fp whoami
> fp orgs current
> fp orgs perms
> ```
>
> In API-key mode, specify `fp --org <slug> --api-key <key> ...` or set `AGENTEYE_ORG`. Saved human-session organization state is intentionally ignored for API-key requests.

> **A policy blocks valid work**
>
> **Dashboard**
>
> Open **Observe → policy**, preserve the decision and linked session, and identify the false-positive condition. Then open **Admin → enforcement** and roll the affected machines back to the prior version. Create a narrower version in **Policy editor**, test it on a small scope, and expand only after valid work succeeds.
>
> **CLI**
>
> Cloud deployment rollback is dashboard-only. A local session pause does not disable Cloud-managed policies. If the dashboard is unavailable, capture the machine and deployment state and restore dashboard access rather than repeatedly retrying the blocked action.
>
> ```bash theme={null}
> failproofai config --status
> ```

> **An error shows a ref**
>
> **Dashboard**
>
> Errors in the dashboard end with a short reference, for example `ref 4bf92f35`. It identifies that one request, and support can use it to find exactly what happened on the server. Copy it into your report as it appears.
>
> If a whole page fails to load, the error page shows a `digest` instead. Include that.
>
> **CLI**
>
> Human-readable `fp` errors end with the same `ref`. With `--json`, the error object carries the full `request_id`:
>
> ```bash theme={null}
> fp --json sessions --since 24h
> ```
>
> **Daemon**
>
> When an upload fails, the daemon's log names a `request_id` and a `batch_id`: on Linux, `sudo journalctl -u failproofaid@$USER | grep batch_id`. Every attempt gets its own `request_id`; the `batch_id` stays the same across retries, so it ties the attempts of one batch together. Include both.

When contacting support, include the CLI version, harness, environment, relevant session or deployment ID, any `ref` or `request_id` from the error, and the output of `failproofai config --status` with secrets removed.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.