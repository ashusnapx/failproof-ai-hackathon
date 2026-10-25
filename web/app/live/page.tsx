"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bot, Check, CircleCheck, LoaderCircle, Mail, Pencil, Play, Plus, ShieldCheck, ShieldX, Snowflake, Trash2, TriangleAlert, User, X } from "lucide-react";
import { Mark } from "../logo";
import { BillsPanel } from "../bills/panel";
import "./live.css";

type Mode = "observe" | "enforce";
type Decision = "allow" | "deny" | "would-deny";
type Vendor = { name: string; upi: string; gstin: string; area: string };
type Provenance = { by: "human" | "vendor-master" | "untrusted" | "ledger"; text: string };
type Policy = { name: string; description: string };
// One SSE event, exactly as written to treasury/state/events.jsonl (plus hello/reset/ledger from the stream).
type Ev = {
  kind: string; ts?: number; text?: string; mode?: Mode; name?: string; input?: string; error?: boolean;
  policy?: string; decision?: Decision; to?: string; amount?: number; memo?: string;
  reason?: string; provenance?: Provenance; balance?: number; running?: boolean; cost?: number; ms?: number;
  vendors?: { vendors: Vendor[] }; opening?: number;
};
type Item = { id: number; e: Ev; lost?: boolean };
type State = {
  vendors: Vendor[]; opening: number; items: Item[]; flagged: string[];
  totals: { paid: number; saved: number; lost: number; checks: number };
  balance: number; running: boolean; runMode: Mode | null; seq: number;
};
type Data = { vendors: Vendor[]; inbox: Email[]; frozen: boolean; frozenBy: string | null; history: Card[]; policies: Policy[] };

const inr = (n: number) => Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const inr0 = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const short = (policy: string) => policy.replace(/^treasury-/, "");
const OPENING = 2500000;
const fresh = (s: Partial<State> = {}): State => ({
  vendors: [], opening: OPENING, items: [], flagged: [], totals: { paid: 0, saved: 0, lost: 0, checks: 0 },
  balance: OPENING, running: false, runMode: null, seq: 0, ...s,
});

// Same bookkeeping as treasury/ui.html: deny = saved (once per payee+amount); executed after a would-deny = lost.
function reduce(s: State, e: Ev): State {
  const push = (lost?: boolean): Item[] => [...s.items, { id: s.seq, e, lost }];
  switch (e.kind) {
    case "hello": // stream replays events.jsonl from the start on every (re)connect, so start clean
      return fresh({ vendors: e.vendors?.vendors ?? [], opening: e.opening ?? OPENING, balance: s.balance, running: s.running });
    case "reset":
      return fresh({ vendors: s.vendors, opening: s.opening, balance: s.balance, running: s.running });
    case "ledger":
      return { ...s, balance: e.balance ?? s.balance, running: !!e.running };
    case "verdict": {
      const key = `${e.to}|${e.amount}`;
      const t = { ...s.totals, checks: s.totals.checks + 1 };
      const flagged = [...s.flagged];
      if (e.decision === "deny" && e.to && !flagged.includes(key)) { t.saved += e.amount || 0; flagged.push(key); }
      if (e.decision === "would-deny") flagged.push("obs|" + key);
      return { ...s, totals: t, flagged, items: push(), seq: s.seq + 1, runMode: e.mode ?? s.runMode };
    }
    case "executed": {
      const bad = s.flagged.includes(`obs|${e.to}|${e.amount}`);
      const amt = e.amount || 0;
      const t = { ...s.totals, ...(bad ? { lost: s.totals.lost + amt } : { paid: s.totals.paid + amt }) };
      return { ...s, totals: t, items: push(bad), seq: s.seq + 1 };
    }
    case "human":
      return { ...s, items: push(), seq: s.seq + 1, runMode: e.mode ?? s.runMode };
    case "agent": case "tool": case "result": case "done": case "stderr": case "eval":
      return { ...s, items: push(), seq: s.seq + 1 };
    default:
      return s;
  }
}

// One slip per payout attempt (every verdict and the execution for the same payee + amount).
// Verdicts that name no payee (the agent sandbox, a command that only mentions bin/pay) become notes, not payouts.
type Check = { policy: string; decision: Decision };
type Payout = {
  key: string; note?: boolean; to: string; amount: number; memo: string; command?: string;
  status: "checking" | "blocked" | "paid" | "lost";
  human?: string; vendor?: string; source?: string; reason?: string; policy?: string; checks: Check[];
};
function payouts(items: Item[]): Payout[] {
  const map = new Map<string, Payout>();
  let command = "";
  for (const { e, lost } of items) {
    if (e.kind === "tool") command = String(e.input ?? "");
    if (e.kind !== "verdict" && e.kind !== "executed") continue;
    if (e.kind === "verdict" && !e.to) {
      map.set(`n${e.ts}${e.policy}`, { key: `n${e.ts}${e.policy}`, note: true, to: "", amount: 0, memo: "", status: "blocked", reason: e.reason?.trim(), policy: e.policy, checks: [] });
      continue;
    }
    const key = `${e.to}|${e.amount}`;
    const p = map.get(key) ?? { key, to: e.to ?? "", amount: e.amount ?? 0, memo: "", status: "checking" as const, checks: [] };
    if (e.memo) p.memo = e.memo;
    if (e.kind === "executed") p.status = lost ? "lost" : "paid";
    else {
      if (/bin\/pay/.test(command)) p.command = command;
      p.checks = [...p.checks.filter((c) => c.policy !== e.policy), { policy: e.policy ?? "", decision: e.decision ?? "allow" }];
      const by = e.provenance?.by;
      if (by === "human") p.human = e.provenance?.text;
      if (by === "vendor-master") p.vendor = e.provenance?.text;
      if (by === "untrusted") p.source = e.provenance?.text.replace(/\s*\(.*\)$/, "");
      if (e.decision !== "allow" && !p.reason) { p.reason = e.reason; p.policy = e.policy; }
      if (e.decision === "deny") p.status = "blocked";
    }
    map.set(key, p);
  }
  return [...map.values()];
}

// The sentence the human typed that carries the budget (older policy builds quote the line before it too).
const budgetLine = (q?: string) => q?.split("\n").find((l) => /budget|₹/i.test(l))?.trim() ?? q;
const budgetAmount = (q?: string) => q?.match(/₹\s?[\d,]+/)?.[0];

function useCount(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const val = a + (target - a) * (1 - Math.pow(2, -10 * p));
      from.current = p < 1 ? val : target;
      setV(p < 1 ? val : target);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// What the agent is doing right now, in a few words.
function activity(items: Item[], running: boolean): string {
  for (let i = items.length - 1; i >= 0; i--) {
    const e = items[i].e;
    if (e.kind === "done") return `Done in ${((e.ms ?? 0) / 1000).toFixed(1)} s · $${(e.cost ?? 0).toFixed(3)}.`;
    if (e.kind === "tool") {
      const input = String(e.input ?? "");
      if (/bin\/pay/.test(input)) return "Paying over UPI…";
      if (e.name === "Read") return `Reading ${input.split("/").pop()}`;
      return "Checking the inbox…";
    }
    if (e.kind === "human") return "Reading the instruction…";
  }
  return running ? "Starting…" : "";
}

export default function Page() {
  const [s, dispatch] = useReducer(reduce, undefined, () => fresh());
  const [mode, setMode] = useState<Mode>("observe");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState("2,00,000");
  const [data, setData] = useState<Data>({ vendors: [], inbox: [], frozen: false, frozenBy: null, history: [], policies: [] });
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data);
        if (e.kind === "data") setData({ vendors: e.vendors, inbox: e.inbox, frozen: !!e.frozen, frozenBy: e.frozenBy ?? null, history: e.history ?? [], policies: e.policies ?? [] });
        else {
          if (e.kind === "ledger" && e.running) setStarting(false);
          dispatch(e);
        }
      } catch { /* ignore a malformed line */ }
    };
    return () => es.close();
  }, []);

  const list = payouts(s.items);
  useEffect(() => {
    const f = feedRef.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [list.length]);

  const busy = s.running || starting;
  async function start() {
    setError("");
    setStarting(true);
    try {
      const r = await fetch(`/api/run?mode=${mode}&budget=${encodeURIComponent(budget)}`, { method: "POST" });
      if (!r.ok) { setError(r.status === 409 ? "Already running." : `Could not start (${r.status}).`); setStarting(false); }
    } catch {
      setError("Server not reachable.");
      setStarting(false);
    }
  }

  const balance = useCount(s.balance);
  // The budget sentence Failproof read back from the transcript (the kill switch is also "human", but carries no budget).
  const said = budgetLine([...s.items].reverse().find((i) => i.e.provenance?.by === "human" && /budget|₹/i.test(i.e.provenance.text))?.e.provenance?.text);
  const now = activity(s.items, busy);
  const done = s.items.some((i) => i.e.kind === "done");
  const report = done ? s.items.findLast((i) => i.e.kind === "agent")?.e.text : undefined;
  const auto = data.frozenBy?.startsWith("auto");
  const state = error ? "error" : busy ? "live" : done ? "done" : "idle";
  const count = (st: Payout["status"]) => list.filter((p) => !p.note && p.status === st).length;

  return (
    <main className="A">
      <header className="top">
        <div className="brand">
          <Link href="/" aria-label="TruePe home"><Mark size={36} /></Link>
          <div>
            <b>TruePe Live</b>
            <small>Dosa Labs AP agent · <a href="https://befailproof.ai" target="_blank" rel="noreferrer">Failproof AI ↗</a> · <Link href="/coverage">Coverage</Link></small>
          </div>
        </div>
        <div className="run">
          <label className="say" title="The human's words: the only thing that authorizes spend">
            Approved budget for this run: ₹<input value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d,]/g, "").slice(0, 12))} disabled={busy} aria-label="Approved budget in rupees" />
          </label>
          <div className="seg" role="group" aria-label="Mode">
            {(["observe", "enforce"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} disabled={busy} aria-pressed={mode === m} title={m === "observe" ? "Failproof only watches: would-block payouts still go through" : "Failproof blocks payouts nobody authorized"}>
                {m === "observe" ? "Observe" : "Enforce"}
              </button>
            ))}
          </div>
          <button className="go" onClick={start} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Play size={16} fill="currentColor" />}{busy ? "Running" : "Run"}</button>
        </div>
        <div className="right">
          <span className={`status ${state}`} role="status"><i />{error || now || "Ready"}</span>
          <button className={`freeze ${data.frozen ? "on" : ""}`} onClick={() => send("/api/freeze", "POST", { frozen: !data.frozen })}>
            <Snowflake size={16} />{data.frozen ? "Unfreeze" : "Freeze"}
          </button>
        </div>
      </header>

      <section className="kpis" aria-label="Money">
        <div><small>Company wallet</small><b>{inr0(balance)}</b></div>
        <div className="paid"><small>Paid to vendors</small><b>{inr0(s.totals.paid)}</b></div>
        <div className="guard"><small>Blocked by Failproof</small><b>{inr0(s.totals.saved)}</b></div>
        <div className={s.totals.lost ? "lost" : ""}><small>Lost to fraud</small><b>{inr0(s.totals.lost)}</b></div>
        <div className="said"><small><User size={13} /> Who said so</small>{said ? <q>{said}</q> : <span>No human words read yet</span>}</div>
      </section>

      <div className="main">
        <div className="feed-head">
          <h2>Payout attempts</h2>
          {list.length ? <span className="counts">{count("paid")} paid · {count("blocked")} blocked{count("lost") ? ` · ${count("lost")} lost` : ""}</span> : null}
        </div>
        <section className="feed" ref={feedRef}>
          {data.frozen ? (
            <div className="frozen"><Snowflake size={20} /> All payouts frozen {auto ? <>by Failproof AI <small>{data.frozenBy?.replace(/^auto:\s*/, "")}</small></> : "by a human"}</div>
          ) : null}
          {list.length === 0 ? (
            <div className="empty">
              <Mark size={44} />
              <b>{busy ? "Waiting for the first payout…" : "No payouts yet"}</b>
              <span>{busy ? "The agent is reading the inbox. Every payout it tries shows up here with Failproof AI's verdict." : "Set the budget the agent may spend, pick Observe (watch only) or Enforce (Failproof blocks), then press Run."}</span>
            </div>
          ) : null}
          {list.map((p) => (p.note ? <Note key={p.key} p={p} /> : <Slip key={p.key} p={p} />))}
          {report ? <div className="report"><span className="lbl"><Bot size={14} /> The agent&rsquo;s report to you</span><p>{report.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").trim()}</p></div> : null}
        </section>
      </div>

      <aside className="side">
        <Evals card={(s.items.findLast((i) => i.e.kind === "eval")?.e as unknown as Card) ?? null} history={data.history} running={busy} />
        <Tabs data={data} items={s.items} />
      </aside>
    </main>
  );
}

type Email = { id: string; from: string; subject: string; body: string };
type Card = {
  ts: number; mode: string; pass: boolean; fraudAttempts: number; fraudBlocked: number; fraudLost: number;
  legit: number; legitPaid: number; wrongAmount: number; overBlocks: number; hallucinations: string[];
  retriesAfterBlock: number; cost: number; ms: number;
};

// Deterministic scorecard of the last run vs treasury/evals/ground-truth.json, plus pass/fail history.
function Evals({ card, history, running }: { card: Card | null; history: Card[]; running: boolean }) {
  const c = running ? null : card ?? history.at(-1) ?? null;
  const rows: [string, string, boolean][] = c ? [
    ["Fraud caught", `${c.fraudBlocked}/${c.fraudAttempts}${c.fraudLost ? ` · ${inr0(c.fraudLost)} lost` : ""}`, c.fraudLost === 0],
    ["Paid right", `${c.legitPaid}/${c.legit}${c.wrongAmount ? ` · ${c.wrongAmount} wrong` : ""}`, c.wrongAmount === 0],
    ["Hallucinated", c.hallucinations.length ? c.hallucinations.join(", ") : "0", c.hallucinations.length === 0],
    ["Over-blocks", String(c.overBlocks), c.overBlocks === 0],
    ["Retries after block", String(c.retriesAfterBlock), c.retriesAfterBlock === 0],
    ["Latency · cost", `${(c.ms / 1000).toFixed(1)} s · $${c.cost.toFixed(3)}`, true],
  ] : [];
  return (
    <div className="card score">
      <div className="head">
        <span className="lbl">Run scorecard</span>
        {c ? <span className={`verdict ${c.pass ? "ok" : "bad"}`}>{c.pass ? "Pass" : "Fail"} · {c.mode}</span> : <span className="verdict">{running ? "scoring…" : "no runs"}</span>}
      </div>
      {rows.length ? <div className="metrics">{rows.map(([k, v, ok]) => <span className={ok ? "" : "bad"} key={k} title={v}><small>{k}</small><b>{v}</b></span>)}</div> : null}
      {history.length ? (
        <div className="hist" aria-label="Last runs">{history.map((h) => <span key={h.ts} className={h.pass ? "ok" : "bad"} title={`${h.pass ? "pass" : "fail"} · ${h.mode} · ${new Date(h.ts).toLocaleTimeString("en-IN")}`}>{h.mode[0].toUpperCase()}</span>)}</div>
      ) : null}
    </div>
  );
}

// Policies, payees and inbox share one card. Panels stay mounted so Gmail sync keeps running on any tab.
function Tabs({ data, items }: { data: Data; items: Item[] }) {
  const [tab, setTab] = useState<"bills" | "policies" | "payees" | "inbox">("bills");
  const tabs = [["bills", "Bills", data.inbox.length], ["policies", "Policies", data.policies.length], ["payees", "Payees", data.vendors.length], ["inbox", "Inbox", data.inbox.length]] as const;
  return (
    <div className="card tabs">
      <div className="tablist" role="tablist">
        {tabs.map(([id, label, n]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}<i>{n}</i></button>)}
      </div>
      <div className="panel" role="tabpanel" hidden={tab !== "bills"}><BillsPanel /></div>
      <div className="panel" role="tabpanel" hidden={tab !== "policies"}><Policies policies={data.policies} items={items} /></div>
      <div className="panel" role="tabpanel" hidden={tab !== "payees"}><Payees vendors={data.vendors} /></div>
      <div className="panel" role="tabpanel" hidden={tab !== "inbox"}><Inbox inbox={data.inbox} /></div>
    </div>
  );
}

// The policy set Failproof AI loads from .failproofai/policies, with this run's decisions per policy.
function Policies({ policies, items }: { policies: Policy[]; items: Item[] }) {
  const tally = new Map<string, Partial<Record<Decision, number>>>();
  for (const { e } of items) {
    if (e.kind !== "verdict" || !e.policy || !e.decision) continue;
    const t = tally.get(e.policy) ?? {};
    t[e.decision] = (t[e.decision] ?? 0) + 1;
    tally.set(e.policy, t);
  }
  return (
    <>
      <div className="crud-head"><span className="lbl">Checked at every tool call</span><a className="ext" href="http://localhost:8020" target="_blank" rel="noreferrer" title="Run `failproofai` to start the local dashboard, then Policies → Activity">Failproof activity ↗</a></div>
      {policies.map((p) => {
        const t = tally.get(p.name) ?? {};
        return (
          <div className="pol" key={p.name}>
            <span><b>{short(p.name)}</b><small>{p.description}</small></span>
            <span className="tally">
              {t.allow ? <i className="allow">{t.allow} ✓</i> : null}
              {t["would-deny"] ? <i className="would-deny">{t["would-deny"]} would block</i> : null}
              {t.deny ? <i className="deny">{t.deny} ✗</i> : null}
            </span>
          </div>
        );
      })}
    </>
  );
}

async function send(url: string, method: string, body?: object) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) return ((await r.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${r.status}`;
  return "";
}

// Approved payees: vendors.json, which treasury-payee-in-vendor-master reads on every payout.
function Payees({ vendors }: { vendors: Vendor[] }) {
  const [edit, setEdit] = useState<string | null>(null); // upi being edited, "" = new
  const [form, setForm] = useState({ name: "", upi: "" });
  const [err, setErr] = useState("");
  const open = (v?: Vendor) => { setErr(""); setEdit(v?.upi ?? ""); setForm({ name: v?.name ?? "", upi: v?.upi ?? "" }); };
  async function save() {
    const e = edit ? await send("/api/vendors", "PUT", { ...form, oldUpi: edit }) : await send("/api/vendors", "POST", form);
    if (e) setErr(e); else setEdit(null);
  }
  const editor = (
    <div className="crud-form">
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="name@bank" value={form.upi} onChange={(e) => setForm({ ...form, upi: e.target.value })} />
      <button onClick={save} aria-label="Save"><Check size={16} /></button>
      <button onClick={() => setEdit(null)} aria-label="Cancel"><X size={16} /></button>
      {err ? <div className="crud-err">{err}</div> : null}
    </div>
  );
  return (
    <>
      <div className="crud-head"><span className="lbl">Read by payee-in-vendor-master</span><button onClick={() => open()} aria-label="Add payee"><Plus size={16} /></button></div>
      {edit === "" ? editor : null}
      {vendors.map((v) => edit === v.upi ? <div key={v.upi}>{editor}</div> : (
        <div className="crud-row" key={v.upi}>
          <span><b>{v.name}</b><code>{v.upi}</code></span>
          <button onClick={() => open(v)} aria-label={`Edit ${v.name}`}><Pencil size={15} /></button>
          <button onClick={() => send(`/api/vendors?upi=${encodeURIComponent(v.upi)}`, "DELETE")} aria-label={`Delete ${v.name}`}><Trash2 size={15} /></button>
        </div>
      ))}
    </>
  );
}

// Inbox: what the agent reads. Anything here is untrusted tool output, never authorization.
function Inbox({ inbox }: { inbox: Email[] }) {
  const [edit, setEdit] = useState<string | null>(null); // id being edited, "" = new
  const [live, setLive] = useState(false);
  const [gmErr, setGmErr] = useState("");
  useEffect(() => {
    if (!live) return;
    const pull = async () => {
      const r = await fetch("/api/gmail", { method: "POST" }).catch(() => null);
      const j = r ? ((await r.json().catch(() => ({}))) as { error?: string }) : { error: "server not reachable" };
      setGmErr(j.error ?? "");
    };
    pull();
    const t = setInterval(pull, 15_000);
    return () => clearInterval(t);
  }, [live]);
  const [form, setForm] = useState({ from: "", subject: "", body: "" });
  const [err, setErr] = useState("");
  const open = (m?: Email) => {
    setErr(""); setEdit(m?.id ?? "");
    setForm({ from: m?.from ?? "", subject: m?.subject ?? "", body: m ? m.body.replace(/^From:[\s\S]*?\n\n/, "") : "" });
  };
  async function save() {
    const e = edit ? await send("/api/inbox", "PUT", { ...form, id: edit }) : await send("/api/inbox", "POST", form);
    if (e) setErr(e); else setEdit(null);
  }
  const editor = (
    <div className="crud-form mail">
      <input placeholder="From" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
      <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <textarea placeholder="Body" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <button onClick={save} aria-label="Save"><Check size={16} /></button>
      <button onClick={() => setEdit(null)} aria-label="Cancel"><X size={16} /></button>
      {err ? <div className="crud-err">{err}</div> : null}
    </div>
  );
  return (
    <>
      <div className="crud-head">
        <span className="lbl untrusted">Untrusted · never authorizes</span>
        <span className="gm">
          <button className={`gmail ${live ? "on" : ""}`} onClick={() => setLive(!live)} aria-pressed={live} title="Pull the newest payment emails from Gmail every 15 s">Gmail{live ? " ●" : ""}</button>
          <button onClick={() => open()} aria-label="Add email"><Plus size={16} /></button>
        </span>
      </div>
      {gmErr ? <div className="crud-err">{gmErr}</div> : null}
      {edit === "" ? editor : null}
      {inbox.map((m) => edit === m.id ? <div key={m.id}>{editor}</div> : (
        <div className="crud-row" key={m.id}>
          <span><b>{m.subject || m.id}</b><code>{m.from}</code></span>
          <button onClick={() => open(m)} aria-label={`Edit ${m.subject}`}><Pencil size={15} /></button>
          <button onClick={() => send(`/api/inbox?id=${encodeURIComponent(m.id)}`, "DELETE")} aria-label={`Delete ${m.subject}`}><Trash2 size={15} /></button>
        </div>
      ))}
    </>
  );
}

const BADGE = {
  checking: <><LoaderCircle size={14} className="spin" /> Checking</>,
  blocked: <><ShieldX size={14} /> Blocked</>,
  paid: <><CircleCheck size={14} /> Paid</>,
  lost: <><TriangleAlert size={14} /> Lost</>,
};

function Slip({ p }: { p: Payout }) {
  const budget = budgetAmount(p.human);
  // Failproof's deny reason is also the agent's instruction: first sentence is the why, the rest tells the agent what to do.
  const [why, ...rest] = (p.reason ?? "").split(/(?<=\.)\s+/);
  const told = rest.filter((r) => !r.startsWith("It came from")).join(" ");
  return (
    <article className={`slip ${p.status}`} title={p.command ? `Failproof saw: ${p.command}` : undefined}>
      <div className="line">
        <span className={`badge ${p.status}`}>{BADGE[p.status]}</span>
        <b className="amt">{inr(p.amount)}</b>
        <code className="to">→ {p.to}</code>
        {p.memo ? <span className="memo">{p.memo}</span> : null}
      </div>
      <div className="body">
        {p.status === "blocked" || p.status === "lost" ? (
          <p className="why bad">
            {p.source ? <><Mail size={15} /> From <b>{p.source}</b>. </> : null}{why}{p.status === "lost" ? " Failproof would have blocked this." : ""}
          </p>
        ) : p.human || p.vendor ? (
          <p className="why">
            {budget ? <><User size={15} /> Within the {budget} you approved</> : null}
            {budget && p.vendor ? " · " : null}
            {p.vendor ? <><BadgeCheck size={15} /> {p.vendor}</> : null}
          </p>
        ) : null}
        {p.status === "blocked" && told ? <p className="told"><Bot size={14} /> Failproof told the agent: {told}</p> : null}
        {p.checks.length ? (
          <ul className="checks" aria-label="Failproof AI policy decisions">
            {p.checks.map((c) => <li key={c.policy} className={c.decision}>{c.decision === "allow" ? <Check size={12} /> : c.decision === "deny" ? <X size={12} /> : <TriangleAlert size={12} />}{short(c.policy)}</li>)}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

// A policy decision with no payout behind it: the agent sandbox, or a command that names no payee.
function Note({ p }: { p: Payout }) {
  return <div className="note"><ShieldCheck size={16} /><span><b>{short(p.policy ?? "")}</b> {p.reason}</span></div>;
}
