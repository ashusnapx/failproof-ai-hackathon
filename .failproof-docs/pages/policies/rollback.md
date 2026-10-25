> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Versions and rollback

> Every publish is an immutable version, so a rollout that disrupts valid agent work is undone by redeploying the last good one.

A published policy version never changes. Editing a policy and publishing again mints a new version; it never rewrites the one already on machines. That is what makes rollback safe: the last good version is still there, byte for byte, and rolling back does not erase the decision history that explains what went wrong.

## Find a version

**Dashboard**

Go to **Admin → policy editor** and open **library** to compare a policy's versions or disable one.

**CLI**

```bash theme={null}
fp policies list                 # every policy version
fp policies show <policy-id>     # one version, with its source
```

## Roll back a machine

**Dashboard**

1. Go to **Admin → enforcement**, expand the affected machine, and identify its last known-good policy set.
2. Select **edit**, restore those versions and effects, and apply the new deployment.
3. Wait for the machine's check-in, then verify the reported deployment.
4. Open **Observe → policy** and the affected sessions to confirm valid work is no longer blocked.

**CLI**

Every deployment to a machine is a numbered generation. List them, then reinstate one:

```bash theme={null}
fp fleet history <machine-id>
fp fleet rollback <machine-id> <generation>
```

`rollback` mints a new generation carrying the old set rather than rewinding the counter, so history stays append-only, and it refuses a generation that names a policy since disabled or deleted. It needs a signed-in session with `policies:write`. `fp fleet diff <machine-id>` shows what was intended against what the machine applied — it reads as `behind` until the machine next polls — and on the machine itself, `failproofai policies` lists the deployment it is running.

## Take one policy off every machine

```bash theme={null}
fp policies disable <policy-id>    # remove it from every deployment carrying it
fp policies enable <policy-id>     # add it back
```

Each mints a new generation on every deployment it touches. Rolling one of those generations back is not how you undo a `disable`, though — `rollback` refuses a generation that names a disabled policy, and every generation from before the disable names this one. `fp policies enable` is the way back, and it mints its own generation in turn.

## Roll back a pack

A pack is pinned to the release you installed, so rolling it back means installing an earlier one:

```bash theme={null}
failproofai policies show FailproofAI/policies --releases   # every version it has published, and which one is here
failproofai policies add FailproofAI/policies@a1b2c3d4e5f6   # pin that one
```

Without a terminal, or with `--policy`, `--category` or `--all`, re-adding keeps the subset you had chosen. At a terminal with none of those, it opens the picker pre-ticked with the author's defaults, and what you tick replaces your selection — so re-tick what you had.

## When to roll back

* A policy blocks an expected production action.
* Match volume is materially higher than the observed rollout predicted.
* A policy depends on fields that an integration does not provide.
* A new version changes behavior outside the intended failure mode.

After rolling back, open the affected sessions and find the condition behind the false positive. Publish a new version, [test](https://docs.befailproof.ai/policies/test.md) both the unsafe and the legitimate case, and observe it again before enforcing.

> [!WARNING]
>
> `failproofai config --pause` suspends local policies for one session and never Cloud-managed ones, so it is no way out of a bad Cloud deployment. A pause also widens exposure for every policy in its scope; prefer rolling back the one version that misbehaves.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.