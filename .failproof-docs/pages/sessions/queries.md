> ## Documentation Index
> Fetch the complete documentation index at: https://docs.befailproof.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Queries

> Explore session, event, and evaluation data with reusable SQL.

Queries are the flexible layer beneath dashboards, audits, and investigations. Use ad-hoc SQL to test an idea, then save the query when it becomes part of a recurring workflow.

## Create and run a query

**Dashboard**

1. Go to **Analyze → Queries** and select **new query**.
2. Open the schema browser and choose fields from the event, session, or evaluation data.
3. Write SQL, add parameters when needed, and run the query.
4. Save it with a clear name and description, then use **add to dashboard** when the result should be monitored.

The query editor combines the event schema, SQL, parameters, and a result preview so you can validate the question before saving it.

![The SQL query editor with a schema browser and live result grid.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/query-lab.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=78f7043cd9c3f851aa821a1128801728)

Saved queries then appear in the shared library, where teammates can rerun them or add their results to dashboards.

![The saved Queries library containing reusable built-in and custom queries.](https://mintcdn.com/exosphere/WgPwQzedeDNwJBTy/images/dashboard/queries.png?fit=max\&auto=format\&n=WgPwQzedeDNwJBTy\&q=85\&s=425798528473f808cdbebb4910ec57a3)

Use a clear name and description so the result remains understandable without reopening its SQL.

**CLI**

```bash theme={null}
fp query schema
fp query create "retry loops" --sql "SELECT ..."
fp query run <query-id>
fp query show <query-id>
fp query update <query-id> --sql "SELECT ..."
```

Use `fp query list` to find IDs and `fp query delete <query-id>` to remove a saved query.

## Common uses

* Find sessions with repeated calls to the same tool.
* Compare evaluation scores across models or environments.
* Measure time between a human wait and resume.
* Identify policy denials followed by a successful alternative.
* Build a cohort for an audit.

Open **Queries → Schema** before writing against unfamiliar fields. Prefer explicit time and environment filters, and keep result limits during exploration.

> [!WARNING]
>
> A query can identify a suspicious pattern, but it does not establish the failure mode by itself. Open representative traces or run an audit before turning the result into a policy.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.