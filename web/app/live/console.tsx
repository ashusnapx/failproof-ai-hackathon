"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, PencilSimpleIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import "./console.css";

type Vendor = { name: string; upi: string };
type Group = { id: string; name: string; cap: number | null };
type Budgets = { groups: Group[]; vendors: Record<string, { group?: string; cap?: number }> };
type When = { payee?: string; amountOver?: number; amountUnder?: number; invoiceNot?: string; outside?: [string, string]; weekend?: boolean };
type Rule = { id: string; name: string; enabled: boolean; action: "block" | "warn"; message: string; when: When };
export type Attempt = { to: string; amount: number; memo: string; ts?: number };
export type ConsoleTab = "budgets" | "rules" | "packs" | "code";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "item";
const uniqueId = (base: string, taken: string[]) => {
  let id = slug(base);
  for (let i = 2; taken.includes(id); i++) id = `${slug(base)}-${i}`;
  return id;
};

async function put<T>(url: string, body: unknown): Promise<{ doc?: T; error?: string }> {
  const r = await fetch(url, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!r) return { error: "server not reachable" };
  const j = await r.json().catch(() => ({}));
  return r.ok ? { doc: j as T } : { error: (j as { error?: string }).error ?? `HTTP ${r.status}` };
}

function useDoc<T>(url: string, empty: T) {
  const [doc, setDoc] = useState<T>(empty);
  useEffect(() => {
    fetch(url, { cache: "no-store" }).then((r) => r.json()).then(setDoc).catch(() => {});
  }, [url]);
  return [doc, setDoc] as const;
}

const TABS: [ConsoleTab, string][] = [["budgets", "Budgets"], ["rules", "Payment rules"], ["packs", "Failproof AI packs"], ["code", "Write your own"]];

// Budgets, no-code rules, Failproof AI's own packs and hand-written policies, in one place.
export function ConsoleDrawer({ tab, onTab, onClose, vendors, spent, attempts, budget, installed }: {
  tab: ConsoleTab; onTab: (t: ConsoleTab) => void; onClose: () => void;
  vendors: Vendor[]; spent: Record<string, number>; attempts: Attempt[]; budget: string; installed: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="cx-wrap" onClick={onClose}>
      <aside className="cx" role="dialog" aria-modal="true" aria-label="Budgets and policies" onClick={(e) => e.stopPropagation()}>
        <header className="cx-head">
          <div className="cx-tabs" role="tablist">
            {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => onTab(id)}>{label}</button>)}
          </div>
          <button className="cx-x" onClick={onClose} aria-label="Close"><XIcon size={18} /></button>
        </header>
        <div className="cx-body">
          {!installed && (tab === "budgets" || tab === "rules") ? (
            <p className="cx-warn">
              Not enforced yet. Copy <code>treasury/policies/truepe-console-policies.mjs</code> into <code>.failproofai/policies/</code> once: Failproof AI&rsquo;s tamper guard lets only a human add files there.
            </p>
          ) : null}
          {tab === "budgets" ? <BudgetsPanel vendors={vendors} spent={spent} budget={budget} /> : null}
          {tab === "rules" ? <RulesPanel attempts={attempts} /> : null}
          {tab === "packs" ? <PacksPanel /> : null}
          {tab === "code" ? <CodePanel /> : null}
        </div>
      </aside>
    </div>
  );
}

function Cap({ value, onChange, label }: { value: number | null; onChange: (v: number | null) => void; label: string }) {
  return (
    <label className="cx-cap" title={label}>
      ₹<input inputMode="numeric" aria-label={label} placeholder="no cap" value={value == null ? "" : value.toLocaleString("en-IN")}
        onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 10); onChange(d ? Number(d) : null); }} />
    </label>
  );
}

function Bar({ used, cap }: { used: number; cap: number | null }) {
  if (cap == null) return <div className="cx-bar none"><span>{inr(used)} spent this run · no cap</span></div>;
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 100;
  return (
    <div className={`cx-bar ${used > cap ? "over" : pct >= 80 ? "near" : ""}`}>
      <i style={{ width: `${pct}%` }} />
      <span>{inr(used)} of {inr(cap)} this run</span>
    </div>
  );
}

// Group and vendor caps per run (treasury/budgets.json), enforced by treasury-group-budgets on top of the approved budget.
function BudgetsPanel({ vendors, spent, budget }: { vendors: Vendor[]; spent: Record<string, number>; budget: string }) {
  const [saved, setSaved] = useDoc<Budgets>("/api/budgets", { groups: [], vendors: {} });
  const [draft, setDraft] = useState<Budgets | null>(null);
  const [err, setErr] = useState("");
  const b = draft ?? saved;
  const edit = (f: (x: Budgets) => void) => { const x = structuredClone(b); f(x); setDraft(x); };
  const members = (group?: string) => vendors.filter((v) => b.vendors[v.upi]?.group === group);
  const groupCaps = b.groups.reduce((t, g) => t + (g.cap ?? 0), 0);
  async function save() {
    const r = await put<Budgets>("/api/budgets", b);
    if (r.error) setErr(r.error);
    else { setSaved(r.doc!); setDraft(null); setErr(""); }
  }
  const row = (v: Vendor) => {
    const cfg = b.vendors[v.upi] ?? {};
    return (
      <div className="cx-vendor" key={v.upi}>
        <span className="cx-who"><b>{v.name}</b><code>{v.upi}</code></span>
        <select value={cfg.group ?? ""} aria-label={`Group for ${v.name}`} onChange={(e) => edit((x) => { x.vendors[v.upi] = { ...x.vendors[v.upi], group: e.target.value || undefined }; })}>
          <option value="">No group</option>
          {b.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <Cap value={cfg.cap ?? null} label={`Cap for ${v.name}`} onChange={(cap) => edit((x) => { x.vendors[v.upi] = { ...x.vendors[v.upi], cap: cap ?? undefined }; })} />
        <Bar used={spent[v.upi] ?? 0} cap={cfg.cap ?? null} />
      </div>
    );
  };
  const loose = members(undefined);
  return (
    <div className="cx-budgets">
      <p className="cx-lede">
        Your sentence (&ldquo;Approved budget for this run: ₹{budget}&rdquo;) caps the whole run. Groups and vendor caps split it further: Failproof AI blocks any payout that would push a group or a vendor past its cap.
        {groupCaps ? <> Group caps add up to <b>{inr(groupCaps)}</b>.</> : null}
      </p>
      {b.groups.map((g) => {
        const m = members(g.id);
        return (
          <section className="cx-group" key={g.id}>
            <div className="cx-ghead">
              <input className="cx-gname" value={g.name} aria-label="Group name" maxLength={40} onChange={(e) => edit((x) => { x.groups.find((y) => y.id === g.id)!.name = e.target.value; })} />
              <Cap value={g.cap} label={`Cap for ${g.name}`} onChange={(cap) => edit((x) => { x.groups.find((y) => y.id === g.id)!.cap = cap; })} />
              <button className="cx-icon" aria-label={`Delete ${g.name}`} onClick={() => edit((x) => {
                x.groups = x.groups.filter((y) => y.id !== g.id);
                for (const v of Object.values(x.vendors)) if (v.group === g.id) delete v.group;
              })}><TrashIcon size={15} /></button>
            </div>
            <Bar used={m.reduce((t, v) => t + (spent[v.upi] ?? 0), 0)} cap={g.cap} />
            {m.map(row)}
            {m.length ? null : <p className="cx-empty">No vendors in this group yet: pick it for a vendor below.</p>}
          </section>
        );
      })}
      {loose.length ? <section className="cx-group loose"><div className="cx-ghead"><b>Not in a group</b></div>{loose.map(row)}</section> : null}
      <button className="cx-add" onClick={() => edit((x) => { x.groups.push({ id: uniqueId("new group", x.groups.map((g) => g.id)), name: "New group", cap: null }); })}>
        <PlusIcon size={15} /> New group
      </button>
      {draft ? (
        <div className="cx-save">
          <span>{err ? <b>{err}</b> : "Unsaved changes"}</span>
          <button onClick={() => { setDraft(null); setErr(""); }}>Discard</button>
          <button className="primary" onClick={save}>Save budgets</button>
        </div>
      ) : null}
    </div>
  );
}

// keep in sync with matches() in treasury/policies/truepe-console-policies.mjs, which enforces the same rule
function matches(rule: Rule, pay: Attempt, now: Date) {
  const w = rule.when;
  const t = new Date(now.getTime() + 330 * 60000);
  const minutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  const hm = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const glob = (p: string) => new RegExp(`^${p.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "i");
  let invoiceOk = true;
  try { invoiceOk = !w.invoiceNot || !new RegExp(w.invoiceNot, "i").test(pay.memo); } catch { invoiceOk = false; }
  return (!w.payee || glob(w.payee).test(pay.to))
    && (w.amountOver == null || pay.amount > w.amountOver)
    && (w.amountUnder == null || pay.amount < w.amountUnder)
    && invoiceOk
    && (!w.outside || minutes < hm(w.outside[0]) || minutes >= hm(w.outside[1]))
    && (!w.weekend || t.getUTCDay() === 0 || t.getUTCDay() === 6);
}

function describe(r: Rule) {
  const w = r.when;
  const parts = [
    w.payee && `to ${w.payee}`,
    w.amountOver != null && `over ${inr(w.amountOver)}`,
    w.amountUnder != null && `under ${inr(w.amountUnder)}`,
    w.invoiceNot && `whose invoice number does not match ${w.invoiceNot}`,
    w.outside && `outside ${w.outside[0]}–${w.outside[1]} IST`,
    w.weekend && "on a weekend",
  ].filter(Boolean);
  return `${r.action === "block" ? "Block" : "Warn the agent about"} payouts ${parts.join(", ") || "(add a condition)"}.`;
}

const TEMPLATES: Omit<Rule, "id" | "enabled">[] = [
  { name: "Hold payouts over ₹1,00,000", action: "block", message: "Payouts over ₹1,00,000 need a human's approval. Ask before paying.", when: { amountOver: 100000 } },
  { name: "Warn on payouts over ₹50,000", action: "warn", message: "Large payout: re-check the invoice and the payee before paying.", when: { amountOver: 50000 } },
  { name: "Business hours only", action: "block", message: "Payouts run only 09:00–19:00 IST. Leave it for a human.", when: { outside: ["09:00", "19:00"] } },
  { name: "No weekend payouts", action: "block", message: "No payouts on weekends. Leave it for a human.", when: { weekend: true } },
  { name: "Invoice number required", action: "block", message: "Every payout needs an invoice number like ABC/123 in --memo.", when: { invoiceNot: "^[A-Z0-9]+[/-][A-Z0-9/-]+$" } },
  { name: "Block a UPI handle", action: "block", message: "Payouts to this UPI handle are not allowed.", when: { payee: "*@paytm" } },
];

const CONDITIONS: { key: keyof When; label: string; fresh: When[keyof When] }[] = [
  { key: "payee", label: "goes to a payee matching", fresh: "*@ybl" },
  { key: "amountOver", label: "is over", fresh: 50000 },
  { key: "amountUnder", label: "is under", fresh: 1000 },
  { key: "invoiceNot", label: "has an invoice number not matching", fresh: "^[A-Z0-9]+[/-][A-Z0-9/-]+$" },
  { key: "outside", label: "happens outside", fresh: ["09:00", "19:00"] },
  { key: "weekend", label: "happens on a weekend", fresh: true },
];

// No-code payout rules (treasury/rules.json), enforced by treasury-console-rules. Backtested against this run before saving.
function RulesPanel({ attempts }: { attempts: Attempt[] }) {
  const [doc, setDoc] = useDoc<{ rules: Rule[] }>("/api/rules", { rules: [] });
  const [form, setForm] = useState<Rule | null>(null);
  const [err, setErr] = useState("");
  async function commit(rules: Rule[]) {
    const r = await put<{ rules: Rule[] }>("/api/rules", { rules });
    if (r.error) { setErr(r.error); return false; }
    setDoc(r.doc!); setErr(""); return true;
  }
  const hits = (r: Rule) => attempts.filter((a) => matches(r, a, new Date(a.ts ?? Date.now())));
  const start = (t: Omit<Rule, "id" | "enabled">) => setForm({ ...structuredClone(t), id: "", enabled: true });
  async function save() {
    if (!form) return;
    const id = form.id || uniqueId(form.name, doc.rules.map((r) => r.id));
    const rules = doc.rules.some((r) => r.id === id) ? doc.rules.map((r) => (r.id === id ? { ...form, id } : r)) : [...doc.rules, { ...form, id }];
    if (await commit(rules)) setForm(null);
  }
  const setWhen = (k: keyof When, v: When[keyof When] | undefined) => form && setForm({ ...form, when: { ...form.when, [k]: v } });
  return (
    <div className="cx-rules">
      <p className="cx-lede">Rules stack on top of TruePe&rsquo;s built-in policies: they can add a block or a warning, never lift one. Failproof AI reads them on every payout.</p>
      {doc.rules.map((r) => (
        <div className={`cx-rule ${r.enabled ? "" : "off"}`} key={r.id}>
          <label className="cx-switch" title={r.enabled ? "On" : "Off"}>
            <input type="checkbox" checked={r.enabled} onChange={() => commit(doc.rules.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))} aria-label={`${r.name} on`} />
            <i />
          </label>
          <span className="cx-rtext"><b>{r.name}</b><small>{describe(r)}</small></span>
          <span className={`cx-act ${r.action}`}>{r.action === "block" ? "Block" : "Warn"}</span>
          <span className="cx-hits" title="Payouts in this run it would have matched">{hits(r).length} hit{hits(r).length === 1 ? "" : "s"}</span>
          <button className="cx-icon" aria-label={`Edit ${r.name}`} onClick={() => setForm(structuredClone(r))}><PencilSimpleIcon size={14} /></button>
          <button className="cx-icon" aria-label={`Delete ${r.name}`} onClick={() => commit(doc.rules.filter((x) => x.id !== r.id))}><TrashIcon size={14} /></button>
        </div>
      ))}
      {err && !form ? <p className="cx-err">{err}</p> : null}
      {form ? (
        <div className="cx-form">
          <input className="cx-gname" value={form.name} maxLength={60} placeholder="Rule name" aria-label="Rule name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <fieldset>
            <legend>When a payout&hellip;</legend>
            {CONDITIONS.map(({ key, label, fresh }) => {
              const on = form.when[key] !== undefined;
              const v = form.when[key];
              return (
                <div className={`cx-cond ${on ? "on" : ""}`} key={key}>
                  <label><input type="checkbox" checked={on} onChange={() => setWhen(key, on ? undefined : structuredClone(fresh))} /> {label}</label>
                  {on && key === "payee" ? <input value={v as string} onChange={(e) => setWhen(key, e.target.value)} aria-label="Payee pattern" /> : null}
                  {on && key === "invoiceNot" ? <input value={v as string} onChange={(e) => setWhen(key, e.target.value)} aria-label="Invoice pattern" /> : null}
                  {on && (key === "amountOver" || key === "amountUnder") ? <Cap value={v as number} label="Amount" onChange={(n) => setWhen(key, n ?? 0)} /> : null}
                  {on && key === "outside" ? (
                    <span className="cx-hours">
                      <input type="time" value={(v as [string, string])[0]} onChange={(e) => setWhen(key, [e.target.value, (v as [string, string])[1]])} aria-label="From" /> –
                      <input type="time" value={(v as [string, string])[1]} onChange={(e) => setWhen(key, [(v as [string, string])[0], e.target.value])} aria-label="To" /> IST
                    </span>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
          <fieldset className="cx-then">
            <legend>Then</legend>
            <label><input type="radio" checked={form.action === "block"} onChange={() => setForm({ ...form, action: "block" })} /> Block the payout <small>(Observe mode only records it)</small></label>
            <label><input type="radio" checked={form.action === "warn"} onChange={() => setForm({ ...form, action: "warn" })} /> Warn the agent, let the payout continue</label>
          </fieldset>
          <input value={form.message} maxLength={200} placeholder="What Failproof AI tells the agent" aria-label="Message to the agent" onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <p className="cx-preview">{describe(form)}</p>
          <p className="cx-backtest">
            Backtest: {attempts.length ? <>would have matched <b>{hits(form).length} of {attempts.length}</b> payouts in this run{hits(form).length ? `: ${hits(form).map((a) => `${inr(a.amount)} → ${a.to}`).join(", ")}` : ""}.</> : "no payouts in this run yet to test against."}
          </p>
          {err ? <p className="cx-err">{err}</p> : null}
          <div className="cx-save inline">
            <button onClick={() => { setForm(null); setErr(""); }}>Cancel</button>
            <button className="primary" onClick={save}><CheckIcon size={15} /> Save rule</button>
          </div>
        </div>
      ) : (
        <div className="cx-templates">
          <span>Start from a template</span>
          {TEMPLATES.map((t) => <button key={t.name} onClick={() => start(t)}>{t.name}</button>)}
          <button className="blank" onClick={() => start({ name: "New rule", action: "block", message: "", when: { amountOver: 100000 } })}><PlusIcon size={14} /> Blank rule</button>
        </div>
      )}
    </div>
  );
}

// Failproof AI's own packs, picked for an accounts-payable agent. The server only ever adds; it never switches one off.
const CATALOG: { policies: string[]; title: string; why: string }[] = [
  { policies: ["block-env-files", "protect-env-vars"], title: "Keep payment keys out of reach", why: "No reading .env files, no dumping environment variables: where UPI and gateway keys live." },
  { policies: ["sanitize-api-keys", "sanitize-bearer-tokens", "sanitize-jwt", "sanitize-private-key-content", "sanitize-connection-strings"], title: "Redact secrets in tool output", why: "A key that turns up in an invoice or API reply is reported before the agent can reuse it." },
  { policies: ["block-curl-pipe-sh"], title: "No downloaded scripts", why: "A poisoned invoice cannot get the agent to pipe a script from the internet into a shell." },
  { policies: ["block-secrets-write"], title: "No writing credentials", why: "Blocks writes to credential and secret-key files." },
  { policies: ["block-sudo", "block-rm-rf"], title: "No root, no wipes", why: "No elevated privileges and no recursive deletes of the ledger or inbox." },
  { policies: ["block-read-outside-cwd"], title: "Stay in the project", why: "Reads outside the repository are blocked." },
  { policies: ["warn-destructive-sql"], title: "Careful with the payments DB", why: "Warns on DROP, TRUNCATE and DELETE without WHERE." },
];

function PacksPanel() {
  const [pick, setPick] = useState<string[]>(CATALOG.slice(0, 3).flatMap((c) => c.policies));
  const [out, setOut] = useState<{ ok: boolean; output: string } | null>(null);
  const [busy, setBusy] = useState("");
  const toggle = (ps: string[]) => setPick((cur) => (ps.every((p) => cur.includes(p)) ? cur.filter((p) => !ps.includes(p)) : [...new Set([...cur, ...ps])]));
  async function call(label: string, init?: RequestInit) {
    setBusy(label);
    const r = await fetch("/api/failproof", init).catch(() => null);
    setOut(r ? await r.json().catch(() => ({ ok: false, output: `HTTP ${r.status}` })) : { ok: false, output: "server not reachable" });
    setBusy("");
  }
  const add = (pack: string, policies: string[]) => call("add", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pack, policies }) });
  const cmd = `failproofai policies add FailproofAI/policies --policy ${pick.join(",")}`;
  return (
    <div className="cx-packs">
      <p className="cx-lede">Ready-made Failproof AI policies that guard everything around the money: secrets, scripts, files. Chosen here for an AP agent; the full coding pack has 39.</p>
      {CATALOG.map((c) => (
        <label className={`cx-pack ${c.policies.every((p) => pick.includes(p)) ? "on" : ""}`} key={c.title}>
          <input type="checkbox" checked={c.policies.every((p) => pick.includes(p))} onChange={() => toggle(c.policies)} />
          <span><b>{c.title}</b><small>{c.why}</small><code>{c.policies.join(" · ")}</code></span>
        </label>
      ))}
      <div className="cx-run">
        <code>{cmd}</code>
        <button className="primary" disabled={!pick.length || !!busy} onClick={() => add("FailproofAI/policies", pick)}>{busy === "add" ? "Adding…" : `Add ${pick.length} policies`}</button>
      </div>
      <div className="cx-pack jev">
        <span>
          <b>Jev: an AI reviewer for every tool call</b>
          <small>16 checks read each call against what you asked, e.g. credential-exfiltration, external-data-egress, agent-config-tampering, secret-exposure. Catches injections no pattern can. After adding, turn Jev on in the local dashboard: Settings → Jev, observe first.</small>
          <code>failproofai policies add FailproofAI/jev-policies</code>
        </span>
        <button disabled={!!busy} onClick={() => add("FailproofAI/jev-policies", [])}>{busy === "add" ? "Adding…" : "Add Jev checks"}</button>
      </div>
      <div className="cx-run">
        <span>Switching a policy off stays a terminal command for a human: <code>failproofai policies --uninstall &lt;name&gt;</code></span>
        <button disabled={!!busy} onClick={() => call("list")}>{busy === "list" ? "Checking…" : "What is enforcing here?"}</button>
      </div>
      {out ? <pre className={`cx-out ${out.ok ? "" : "bad"}`}>{out.output || (out.ok ? "Done." : "Failed.")}</pre> : null}
    </div>
  );
}

const TEMPLATE = `import { customPolicies, allow, deny, instruct } from "failproofai";

// Save as .failproofai/policies/<name>-policies.mjs; Failproof AI loads it on the next tool call.
customPolicies.add({
  name: "truepe-large-payout-needs-po",
  description: "Payouts over ₹5,00,000 need a purchase order number in --memo",
  category: "Payments",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    // ctx.toolName / ctx.toolInput: what the agent is about to run
    // ctx.session.transcriptPath: the session, to read what the human actually said
    const command = String(ctx.toolInput?.command ?? "");
    if (ctx.toolName !== "Bash" || !/bin\\/pay\\b/.test(command)) return allow();
    const amount = Number(command.match(/--amount\\s+(\\d+)/)?.[1] ?? 0);
    const memo = command.match(/--memo\\s+(\\S+)/)?.[1] ?? "";
    if (amount > 500000 && !/^PO-/.test(memo)) return deny("Over ₹5,00,000 needs a PO number (PO-…) in --memo. Ask the human.");
    if (amount > 200000) return instruct("Large payout: confirm the invoice total before paying.");
    return allow();
  },
});
`;

function CodePanel() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="cx-code">
      <p className="cx-lede">Anything a rule cannot express: read the human&rsquo;s transcript, call your ERP, compare against a PO. A policy is plain JavaScript that returns <code>allow</code>, <code>instruct</code> or <code>deny</code> before the tool runs.</p>
      <div className="cx-snippet">
        <button onClick={() => { navigator.clipboard.writeText(TEMPLATE).then(() => setCopied(true)).catch(() => {}); }}>{copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}{copied ? "Copied" : "Copy"}</button>
        <pre>{TEMPLATE}</pre>
      </div>
      <p className="cx-lede">
        Prefer a UI? Failproof AI Cloud&rsquo;s policy editor drafts one from a sentence, backtests it against your past sessions and ships it in observe mode first:{" "}
        <a href="https://app.befailproof.ai" target="_blank" rel="noreferrer">app.befailproof.ai ↗</a>
      </p>
    </div>
  );
}
