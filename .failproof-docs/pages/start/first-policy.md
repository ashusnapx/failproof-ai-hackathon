> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Prevent your first failure with a policy

> Author a policy version, deploy it in observe mode, and then enforce it.

Use a policy only after you can describe the unsafe action and the legitimate actions that must remain allowed.

**Dashboard**

**1. Author the policy**

Go to **Admin → policy editor**. Start with the demo policy, review or edit its source, then select **publish version**. Publishing creates the immutable version that you can deploy to machines.

![The Policy editor compose view with a demo policy ready to publish as an immutable version.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/policy-editor.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=7c01c862f4ec601d0535a6969eb619ce)

**2. Deploy it to a machine**

Go to **Admin → enforcement**, expand the target machine, and select **edit this machine**. Add the published demo policy, pin its version, choose **observe**, and apply the deployment.

![The machine deployment editor with a published policy version selected in observe mode before applying the deployment.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/enforcement-editor.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=264a3a1f53c025dae05c8498156aa49a)

**3. Verify the policy**

Run a new agent session on that machine, then open **Observe → policy**. Select the machine and confirm that the demo policy appears in the policy mapping and decision timeline. Observe mode records what the policy would do without blocking the action.

![The Policy page showing decision totals, enforcement activity over time, and local and Cloud-managed policy mappings.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/policy-observe.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=13535ad27c8bddac6589f9d1560916cb)

**CLI**

Cloud policy authoring and fleet deployment are administrative workflows. Use the local CLI to validate the same policy before publishing it:

```bash theme={null}
failproofai policies --install --custom ./payment-retry.policies.ts \
  --cli claude --scope project
failproofai config --status
```

Use `fp` to inspect Cloud-visible policy decisions:

```bash theme={null}
fp events --event-type hook_completed --env production --since 24h
fp sessions --env production --since 24h
```

Both steps are available from the CLI too: `fp policies publish <id> <file>` mints a version and `fp fleet deploy <machine-id> --add <id>` puts it on a machine. The dashboard equivalents are **Admin → policy editor** and **Admin → enforcement**.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.