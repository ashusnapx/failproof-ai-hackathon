// Budgets and rules a human sets in the TruePe console. treasury/policies/truepe-console-policies.mjs reads
// these files on every payout, so a save here takes effect on the next tool call, no reinstall.
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { root } from "./treasury";

const file = (name: string) => path.join(root, "treasury", name);
const read = <T,>(name: string, fallback: T): T => {
  try {
    return JSON.parse(readFileSync(file(name), "utf8"));
  } catch {
    return fallback;
  }
};
const write = (name: string, doc: unknown) => writeFileSync(file(name), JSON.stringify(doc, null, 2) + "\n");

export type Group = { id: string; name: string; cap: number | null };
export type Budgets = { groups: Group[]; vendors: Record<string, { group?: string; cap?: number }> };
export type Rule = {
  id: string; name: string; enabled: boolean; action: "block" | "warn"; message: string;
  when: { payee?: string; amountOver?: number; amountUnder?: number; invoiceNot?: string; outside?: [string, string]; weekend?: boolean };
};

const ID = /^[a-z0-9-]{1,40}$/;
const UPI = /^[\w.-]{2,64}@[\w.-]{2,32}$/;
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
const rupees = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e10;
const label = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

export const readBudgets = () => read<Budgets>("budgets.json", { groups: [], vendors: {} });
export function saveBudgets(input: unknown): string | null {
  const b = input as Budgets;
  if (!b || !Array.isArray(b.groups) || typeof b.vendors !== "object" || b.groups.length > 20) return "groups (max 20) and vendors are required";
  const ids = new Set<string>();
  for (const g of b.groups) {
    if (!ID.test(g.id) || ids.has(g.id)) return `group id "${g.id}" must be unique, a-z 0-9 -`;
    if (!label(g.name, 40)) return "every group needs a name (max 40 characters)";
    if (g.cap !== null && !rupees(g.cap)) return `cap for "${g.name}" must be a rupee amount or empty`;
    ids.add(g.id);
  }
  for (const [upi, v] of Object.entries(b.vendors)) {
    if (!UPI.test(upi)) return `${upi} is not a UPI ID`;
    if (v.group !== undefined && !ids.has(v.group)) return `${upi} points at a group that does not exist`;
    if (v.cap !== undefined && !rupees(v.cap)) return `cap for ${upi} must be a rupee amount or empty`;
  }
  write("budgets.json", { groups: b.groups.map(({ id, name, cap }) => ({ id, name: name.trim(), cap })), vendors: b.vendors });
  return null;
}

export const readRules = () => read<{ rules: Rule[] }>("rules.json", { rules: [] });
export function saveRules(input: unknown): string | null {
  const rules = (input as { rules?: Rule[] })?.rules;
  if (!Array.isArray(rules) || rules.length > 30) return "rules (max 30) are required";
  const ids = new Set<string>();
  for (const r of rules) {
    const w = r.when ?? {};
    if (!ID.test(r.id) || ids.has(r.id)) return `rule id "${r.id}" must be unique, a-z 0-9 -`;
    if (!label(r.name, 60)) return "every rule needs a name (max 60 characters)";
    if (r.action !== "block" && r.action !== "warn") return `"${r.name}": action must be block or warn`;
    if (typeof r.message !== "string" || r.message.length > 200) return `"${r.name}": message is max 200 characters`;
    if (w.payee !== undefined && !/^[\w.@*-]{1,100}$/.test(w.payee)) return `"${r.name}": payee pattern may use letters, digits, . @ - _ and *`;
    if (w.amountOver !== undefined && !rupees(w.amountOver)) return `"${r.name}": "over" must be a rupee amount`;
    if (w.amountUnder !== undefined && !rupees(w.amountUnder)) return `"${r.name}": "under" must be a rupee amount`;
    if (w.invoiceNot !== undefined) {
      if (typeof w.invoiceNot !== "string" || w.invoiceNot.length > 60) return `"${r.name}": invoice pattern is max 60 characters`;
      try { new RegExp(w.invoiceNot); } catch { return `"${r.name}": invoice pattern is not a valid regular expression`; }
    }
    if (w.outside !== undefined && !(Array.isArray(w.outside) && w.outside.length === 2 && w.outside.every((x) => HM.test(x)))) return `"${r.name}": hours must be HH:MM to HH:MM`;
    if (w.weekend !== undefined && typeof w.weekend !== "boolean") return `"${r.name}": weekend must be true or false`;
    // a rule with no condition would match every payout: that is the kill switch's job
    if (![w.payee, w.amountOver, w.amountUnder, w.invoiceNot, w.outside, w.weekend || undefined].some((x) => x !== undefined)) return `"${r.name}" needs at least one condition`;
    ids.add(r.id);
  }
  write("rules.json", { rules: rules.map(({ id, name, enabled, action, message, when }) => ({ id, name: name.trim(), enabled: enabled !== false, action, message, when })) });
  return null;
}

// Failproof AI's own packs. Add-only from the web: switching a policy off stays a terminal command for a human,
// so nothing that can reach this server can weaken the guardrails.
export const PACKS: Record<string, string[]> = {
  "FailproofAI/policies": [
    "block-env-files", "protect-env-vars", "sanitize-api-keys", "sanitize-bearer-tokens", "sanitize-jwt", "sanitize-private-key-content",
    "sanitize-connection-strings", "block-secrets-write", "block-curl-pipe-sh", "block-sudo", "block-rm-rf", "block-read-outside-cwd", "warn-destructive-sql",
  ],
  "FailproofAI/jev-policies": [],
};

const failproofai = (args: string[]) =>
  new Promise<{ ok: boolean; output: string }>((resolve) =>
    execFile("failproofai", args, { timeout: 90_000, maxBuffer: 1 << 20 }, (err, stdout, stderr) =>
      resolve({ ok: !err, output: `${stdout}${stderr}`.trim() || (err ? err.message : "") })));

export const listMachinePolicies = () => failproofai(["policies"]);
export function addFromPack(pack: string, policies: string[]) {
  const allowed = PACKS[pack];
  if (!allowed || policies.some((p) => !allowed.includes(p))) return Promise.resolve({ ok: false, output: "unknown pack or policy" });
  return failproofai(["policies", "add", pack, ...(policies.length ? ["--policy", policies.join(",")] : [])]);
}
