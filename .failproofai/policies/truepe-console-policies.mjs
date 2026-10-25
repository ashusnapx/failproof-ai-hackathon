// TruePe console policies: budgets and rules a human sets on /live, read fresh on every payout.
// They only add limits on top of treasury-policies.mjs; nothing here can approve a payout those deny.
import { customPolicies, allow, deny, instruct } from "failproofai";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PAY = /(?:^|[\s/])bin\/pay\b/;
const inr = (n) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

// The treasury dir and every bin/pay call in this Bash command that names a payee; null when there is nothing to check.
function payouts(ctx) {
  if (ctx.toolName !== "Bash") return null;
  const dir = join(String(ctx.session?.cwd ?? ""), "treasury");
  if (!existsSync(join(dir, "vendors.json"))) return null;
  const pays = String(ctx.toolInput?.command ?? "")
    .split(/&&|\|\||;|\n/)
    .filter((part) => PAY.test(part))
    .map((part) => {
      const flag = (name) => part.match(new RegExp(`--${name}\\s+(["']?)([^"'\\s]+)\\1`))?.[2] ?? "";
      return { to: flag("to"), amount: Number(flag("amount").replace(/[₹,]|rs\.?/gi, "")), memo: flag("memo") };
    })
    .filter((p) => p.to);
  return pays.length ? { dir, pays } : null;
}

function log(dir, policy, decision, pay, verdict) {
  try {
    const mode = readJson(join(dir, "state", "mode.json"), { mode: "enforce" }).mode;
    appendFileSync(join(dir, "state", "events.jsonl"), JSON.stringify({ ts: Date.now(), kind: "verdict", policy, decision, mode, ...pay, ...verdict }) + "\n");
  } catch {
    // shortcut: the UI log is best-effort; the decision returned below still applies.
  }
}

// Same switch as treasury-policies.mjs: enforce denies, observe only records what it would have denied.
function block(dir, policy, pay, verdict) {
  const observe = readJson(join(dir, "state", "mode.json"), { mode: "enforce" }).mode === "observe";
  log(dir, policy, observe ? "would-deny" : "deny", pay, verdict);
  return observe ? null : deny(`Blocked by Failproof AI (${policy}): ${verdict.reason}`);
}

customPolicies.add({
  name: "treasury-group-budgets",
  description: "Per-group and per-vendor spend caps a human sets in the TruePe console (treasury/budgets.json), on top of the run budget",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    const c = payouts(ctx);
    if (!c) return allow();
    const { groups = [], vendors = {} } = readJson(join(c.dir, "budgets.json"), {});
    const paid = readJson(join(c.dir, "state", "ledger.json"), { payments: [] }).payments;
    const spent = (upis) => paid.filter((p) => upis.includes(p.to)).reduce((t, p) => t + p.amount, 0);
    for (const pay of c.pays) {
      const v = vendors[pay.to] ?? {};
      const g = groups.find((x) => x.id === v.group);
      const caps = [];
      if (typeof v.cap === "number") caps.push({ label: `vendor cap for ${pay.to}`, cap: v.cap, used: spent([pay.to]) });
      if (g && typeof g.cap === "number") {
        const members = Object.keys(vendors).filter((u) => vendors[u].group === g.id);
        caps.push({ label: `"${g.name}" group budget`, cap: g.cap, used: spent(members) });
      }
      if (!caps.length) continue;
      const over = caps.find((x) => x.used + pay.amount > x.cap);
      const source = { by: "human", text: g ? `"${g.name}" budget, set in the TruePe console` : "vendor cap, set in the TruePe console" };
      if (over) {
        const blocked = block(c.dir, "treasury-group-budgets", pay, {
          ok: false,
          reason: `${inr(pay.amount)} would take the ${over.label} to ${inr(over.used + pay.amount)}, over its ${inr(over.cap)}. Ask the human before paying.`,
          provenance: source,
        });
        if (blocked) return blocked;
        continue;
      }
      log(c.dir, "treasury-group-budgets", "allow", pay, { ok: true, reason: caps.map((x) => `${inr(x.used + pay.amount)} of ${inr(x.cap)} ${x.label}`).join("; "), provenance: source });
    }
    return allow();
  },
});

// keep in sync with matches() in web/app/live/console.tsx, which backtests rules in the browser
const IST_OFFSET_MIN = 330;
function matches(rule, pay, now) {
  const w = rule.when ?? {};
  const t = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  const minutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  const hm = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const glob = (p) => new RegExp(`^${p.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "i");
  return (!w.payee || glob(w.payee).test(pay.to))
    && (w.amountOver == null || pay.amount > w.amountOver)
    && (w.amountUnder == null || pay.amount < w.amountUnder)
    && (!w.invoiceNot || !new RegExp(w.invoiceNot, "i").test(pay.memo))
    && (!w.outside || minutes < hm(w.outside[0]) || minutes >= hm(w.outside[1]))
    && (!w.weekend || t.getUTCDay() === 0 || t.getUTCDay() === 6);
}

customPolicies.add({
  name: "treasury-console-rules",
  description: "No-code payout rules a human adds in the TruePe console (treasury/rules.json): block or warn on payee, amount, invoice or time",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    const c = payouts(ctx);
    if (!c) return allow();
    const rules = readJson(join(c.dir, "rules.json"), { rules: [] }).rules.filter((r) => r.enabled !== false);
    const warnings = [];
    for (const pay of c.pays) {
      for (const rule of rules) {
        if (!matches(rule, pay, new Date())) continue;
        const verdict = { ok: false, rule: rule.name, reason: rule.message || `Rule "${rule.name}" matched.`, provenance: { by: "human", text: `rule "${rule.name}", added in the TruePe console` } };
        if (rule.action === "warn") {
          log(c.dir, "treasury-console-rules", "instruct", pay, verdict);
          warnings.push(`TruePe rule "${rule.name}": ${verdict.reason}`);
          continue;
        }
        const blocked = block(c.dir, "treasury-console-rules", pay, verdict);
        if (blocked) return blocked;
      }
    }
    return warnings.length ? instruct(warnings.join(" ")) : allow();
  },
});
