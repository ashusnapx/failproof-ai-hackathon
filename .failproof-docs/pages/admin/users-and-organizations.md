> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Users and organizations

> Control membership and keep each organization's data and actions scoped.

Organizations isolate sessions, evaluations, audits, issues, alerts, queries, dashboards, users, and keys. Confirm the active organization before changing administrative resources.

## Manage members and organizations

**Dashboard**

1. Use the organization switcher at the top of the Cloud sidebar to change organizations.
2. Go to **Administration → Users** to search members or filter by active state and role.
3. Select **new user**, enter the email, choose a permission set, and adjust overrides if needed.
4. Open a user later to update grants, disable sign-in, or enable the account again.

   ![The Users page showing member email addresses, permission sets, and edit and disable controls.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/users.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=6489426b518fb3f8116b9a50b448521a)

**CLI**

```bash theme={null}
fp orgs list
fp orgs switch reliability-team
fp orgs current
fp orgs perms

fp users create engineer@example.com --permission-set standard
fp users show engineer@example.com
fp users update engineer@example.com --add audits:write
fp users disable engineer@example.com
fp users enable engineer@example.com
```

Administrators can create, update, disable, and re-enable users, then assign the permission set appropriate for their role. The API uses a delete operation for disabling, but it does not remove the account or its membership record.

> [!WARNING]
>
> Disabling a user blocks that identity from signing in to every organization, not only the organization currently selected. Re-enabling restores global sign-in and the member's permissions in this organization.

> [!TIP]
>
> Give service accounts descriptive names tied to a workload and owner. Avoid sharing keys between organizations or between people and machines.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.