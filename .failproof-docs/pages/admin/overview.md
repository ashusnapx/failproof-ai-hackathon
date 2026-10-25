> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Administration

> Operate access, usage, organizations, and security without mixing them into the reliability workflow.

Administration contains the controls needed to run Failproof AI across a team. Most readers can stay in Sessions, Audits, and Policies; administrators use this section to manage access and operating boundaries.

**Dashboard**

Use the Cloud sidebar's **Admin** section for **policy editor**, **enforcement**, **usage**, **keys**, **users**, and **settings**. A locked item shows that your account is missing its read permission.

![The Admin section of the Cloud sidebar with policy editor, enforcement, usage, keys, users, and settings.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/admin-navigation.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=24661fb5ca014a16ddbfdaee8b7803d2)

**CLI**

```bash theme={null}
fp whoami
fp orgs current
fp orgs perms
fp usage
```

Put global options before the command, for example `fp --org reliability-team --json usage`.

> **[Usage](https://docs.befailproof.ai/admin/usage.md)**
>
> Inspect billing windows and organization consumption.

> **[Keys and permissions](https://docs.befailproof.ai/admin/keys-and-permissions.md)**
>
> Give machines and automation only the permissions they require.

> **[Users and organizations](https://docs.befailproof.ai/admin/users-and-organizations.md)**
>
> Manage membership, defaults, and organization boundaries.

> **[Settings and security](https://docs.befailproof.ai/admin/settings-and-security.md)**
>
> Configure operational settings, data handling, and deployment security.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.