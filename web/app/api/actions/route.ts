import { addFromPack, readBudgets, readRules, saveBudgets, saveRules, type Group, type Rule } from "@/lib/console";
import { deleteEmail, deleteVendor, setFrozen, upsertEmail, upsertVendor } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = {
  type?: string; id?: unknown; name?: unknown; upi?: unknown; rule?: Rule; group?: Group; vendor?: { upi?: string; group?: string; cap?: number };
  frozen?: unknown; pack?: unknown; policies?: unknown; from?: unknown; subject?: unknown; body?: unknown;
};

const inr = (n: number | null | undefined) => (typeof n === "number" ? "₹" + n.toLocaleString("en-IN") : "no cap");
// The agent may not know an id: "Office & pantry" must update the group a human sees by that name, not add a twin.
const same = (x: { id: string; name: string }, y: { id?: unknown; name?: unknown }) =>
  x.id === y.id || x.name.trim().toLowerCase() === String(y.name ?? "").trim().toLowerCase();

// An ACTION line from a TruePe AI chat reply, posted only when the human clicks its button. The agent cannot call
// this itself (treasury-agent-sandbox); every case reuses the console's own validation and reports what changed.
export async function POST(req: Request) {
  const a = (await req.json().catch(() => ({}))) as Action;
  let error: string | null = "unknown action";
  let result = "";
  if (a.type === "payee") {
    error = upsertVendor({ name: a.name, upi: a.upi });
    result = `${a.name} (${a.upi}) is an approved payee`;
  }
  if (a.type === "payee-remove") {
    error = deleteVendor(typeof a.upi === "string" ? a.upi : null);
    result = `${a.upi} is no longer an approved payee`;
  }
  if (a.type === "email") {
    error = upsertEmail({ from: a.from, subject: a.subject, body: a.body });
    result = "Added to the inbox";
  }
  if (a.type === "email-remove") {
    error = deleteEmail(typeof a.id === "string" ? a.id : null);
    result = `Deleted ${a.id}`;
  }
  if (a.type === "rule") {
    const rules = readRules().rules;
    const old = a.rule && typeof a.rule === "object" ? rules.find((r) => same(r, a.rule!)) : undefined;
    const rule = a.rule && typeof a.rule === "object" ? { ...a.rule, id: old?.id ?? a.rule.id } : null;
    error = rule ? saveRules({ rules: old ? rules.map((r) => (r === old ? rule : r)) : [...rules, rule] }) : "rule is required";
    result = `Rule “${rule?.name}” ${old ? "updated" : "added"}`;
  }
  if (a.type === "rule-remove") {
    const { rules } = readRules();
    error = rules.some((r) => r.id === a.id) ? saveRules({ rules: rules.filter((r) => r.id !== a.id) }) : "no such rule";
    result = `Rule ${a.id} removed`;
  }
  if (a.type === "budget") {
    const b = readBudgets();
    const upi = a.vendor?.upi;
    // "@" keeps keys like __proto__ out before saveBudgets checks the full UPI format
    if (a.vendor && !(typeof upi === "string" && upi.includes("@"))) error = "vendor needs a UPI ID";
    else if (!a.group && !a.vendor) error = "group or vendor is required";
    else {
      if (a.group && typeof a.group === "object") {
        const old = b.groups.find((g) => same(g, a.group!));
        const g = { ...a.group, id: old?.id ?? a.group.id, name: old && !a.group.name ? old.name : a.group.name };
        b.groups = old ? b.groups.map((x) => (x === old ? g : x)) : [...b.groups, g];
        result = old ? `“${g.name}” cap ${inr(old.cap)} → ${inr(g.cap)}` : `New group “${g.name}”, cap ${inr(g.cap)}`;
      }
      if (a.vendor && upi) {
        const v = (b.vendors[upi] ??= {});
        if (a.vendor.group !== undefined) v.group = a.vendor.group;
        if (a.vendor.cap !== undefined) v.cap = a.vendor.cap;
        result = [result, `${upi}: ${[v.group && `group ${v.group}`, v.cap !== undefined && `cap ${inr(v.cap)}`].filter(Boolean).join(", ")}`].filter(Boolean).join("; ");
      }
      error = saveBudgets(b);
    }
  }
  if (a.type === "budget-remove") {
    const b = readBudgets();
    const g = b.groups.find((x) => x.id === a.id);
    // vendors pointing at the group would fail saveBudgets, so they leave it with it
    for (const v of Object.values(b.vendors)) if (g && v.group === g.id) delete v.group;
    error = g ? saveBudgets({ ...b, groups: b.groups.filter((x) => x !== g) }) : "no such group";
    result = `Group “${g?.name}” removed`;
  }
  if (a.type === "freeze") {
    setFrozen(a.frozen === true);
    error = null;
    result = a.frozen === true ? "Every payout is frozen" : "Payouts resumed";
  }
  if (a.type === "pack") {
    const r = await addFromPack(String(a.pack ?? ""), Array.isArray(a.policies) ? a.policies.map(String) : []);
    error = r.ok ? null : r.output;
    result = r.output.split("\n").find((l) => l.trim()) ?? "Turned on";
  }
  return error ? Response.json({ error }, { status: 400 }) : Response.json({ ok: true, result });
}
