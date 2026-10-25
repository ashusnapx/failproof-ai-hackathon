"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Mail, Pencil, Play, Plus, ShieldCheck, Snowflake, Trash2, User, X } from "lucide-react";
import { Mark } from "../logo";

type Mode = "observe" | "enforce";
type Vendor = { name: string; upi: string; gstin: string; area: string };
type Provenance = { by: "human" | "vendor-master" | "untrusted"; text: string };
// One SSE event, exactly as written to treasury/state/events.jsonl (plus hello/reset/ledger from the stream).
type Ev = {
  kind: string; ts?: number; text?: string; mode?: Mode; name?: string; input?: string; error?: boolean;
  policy?: string; decision?: "allow" | "deny" | "would-deny"; to?: string; amount?: number; memo?: string;
  reason?: string; provenance?: Provenance; balance?: number; running?: boolean; cost?: number; ms?: number;
  vendors?: { vendors: Vendor[] }; opening?: number;
};
type Item = { id: number; e: Ev; lost?: boolean };
type State = {
  vendors: Vendor[]; opening: number; items: Item[]; flagged: string[];
  totals: { paid: number; saved: number; lost: number; checks: number };
  balance: number; running: boolean; runMode: Mode | null; seq: number;
};

const inr = (n: number) => Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const inr0 = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
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
      if (e.decision === "deny" && !flagged.includes(key)) { t.saved += e.amount || 0; flagged.push(key); }
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

// One painted board per payout attempt: every verdict and the execution for the same payee + amount.
type Payout = {
  key: string; to: string; amount: number; memo: string;
  status: "checking" | "blocked" | "paid" | "lost";
  human?: string; vendor?: string; source?: string; reason?: string; policy?: string; checks: number;
};
function payouts(items: Item[]): Payout[] {
  const map = new Map<string, Payout>();
  for (const { e, lost } of items) {
    if (e.kind !== "verdict" && e.kind !== "executed") continue;
    const key = `${e.to}|${e.amount}`;
    const p = map.get(key) ?? { key, to: e.to ?? "", amount: e.amount ?? 0, memo: "", status: "checking" as const, checks: 0 };
    if (e.memo) p.memo = e.memo;
    if (e.kind === "executed") p.status = lost ? "lost" : "paid";
    else {
      p.checks++;
      if (e.decision !== "allow" && !p.policy) p.policy = e.policy;
      const by = e.provenance?.by;
      if (by === "human") p.human = e.provenance?.text;
      if (by === "vendor-master") p.vendor = e.provenance?.text;
      if (by === "untrusted") p.source = e.provenance?.text.replace(/\s*\(.*\)$/, "");
      if (e.decision !== "allow") p.reason = e.reason?.split(". ")[0] + ".";
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
    if (e.kind === "done") return "Done.";
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
  const [data, setData] = useState<{ vendors: Vendor[]; inbox: Email[]; frozen: boolean; history: Card[] }>({ vendors: [], inbox: [], frozen: false, history: [] });
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data);
        if (e.kind === "data") setData({ vendors: e.vendors, inbox: e.inbox, frozen: !!e.frozen, history: e.history ?? [] });
        else dispatch(e);
      } catch { /* ignore a malformed line */ }
    };
    return () => es.close();
  }, []);

  const list = payouts(s.items);
  useEffect(() => {
    const f = feedRef.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [list.length]);

  useEffect(() => { if (s.running) setStarting(false); }, [s.running]);

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
  const said = budgetLine([...s.items].reverse().find((i) => i.e.provenance?.by === "human")?.e.provenance?.text);
  const now = activity(s.items, busy);

  return (
    <main className="A">
      <div className="board shopname">
        <div className="brand">
          <Link href="/" aria-label="TruePe home"><Mark size={64} /></Link>
          <div>
            <h1>TruePe · Dosa Labs</h1>
            <small>27th Main, Sector 1, HSR Layout · AP agent on Claude Code · enforced by <a className="fp" href="https://app.befailproof.ai" target="_blank" rel="noreferrer">Failproof AI ↗</a></small>
          </div>
        </div>
        <div className="modes">
          {(["observe", "enforce"] as const).map((m) => (
            <button key={m} className={`pill ${mode === m ? "on" : ""}`} onClick={() => setMode(m)} disabled={busy} aria-pressed={mode === m}>
              {m === "observe" ? "Observe" : "Enforce"}{mode === m ? " ●" : ""}
            </button>
          ))}
          <label className="pill budget" title="Budget the human approves for this run">
            ₹<input value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d,]/g, "").slice(0, 12))} disabled={busy} aria-label="Approved budget in rupees" />
          </label>
          <button className="pill run" onClick={start} disabled={busy}>
            <Play size={16} fill="currentColor" />{busy ? "Live" : "Run"}
          </button>
          <button className={`pill freeze ${data.frozen ? "on" : ""}`} onClick={() => send("/api/freeze", "POST", { frozen: !data.frozen })} aria-pressed={data.frozen}>
            <Snowflake size={16} />{data.frozen ? "Frozen" : "Freeze"}
          </button>
          <span className="kn">ಯಾರು ಹೇಳಿದರು?</span>
        </div>
      </div>

      <div className="feed" ref={feedRef}>
        {data.frozen ? <div className="frozen"><Snowflake size={22} /> All payouts frozen by a human</div> : null}
        <div className={`now ${busy ? "on" : ""}`}>{error || now || "Press Run."}</div>
        {list.map((p) => <PayBoard key={p.key} p={p} />)}
      </div>

      <div className="side">
        <div className="board wallet">
          <div className="lbl">Company wallet</div>
          <div className="big">{inr0(balance)}</div>
          <div className="row"><span>Paid to vendors</span><span>{inr0(s.totals.paid)}</span></div>
          <div className="row"><span>Blocked by Failproof</span><span>{inr0(s.totals.saved)}</span></div>
          <div className={`row ${s.totals.lost ? "lost" : ""}`}><span>Lost to fraud</span><span>{inr0(s.totals.lost)}</span></div>
        </div>
        <Evals card={(s.items.findLast((i) => i.e.kind === "eval")?.e as unknown as Card) ?? null} history={data.history} running={busy} />
        <div className="board said">
          <div className="lbl">Who said so? The human:</div>
          {said ? <q>{said}</q> : <q className="none">Nobody yet.</q>}
        </div>
        <Payees vendors={data.vendors} />
        <Inbox inbox={data.inbox} />
      </div>
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
    ["Accuracy", `${c.legitPaid}/${c.legit} paid right${c.wrongAmount ? ` · ${c.wrongAmount} wrong amount` : ""}`, c.wrongAmount === 0],
    ["Hallucinations", c.hallucinations.length ? c.hallucinations.join(", ") : "0", c.hallucinations.length === 0],
    ["Over-blocks", String(c.overBlocks), c.overBlocks === 0],
    ["Retries after block", String(c.retriesAfterBlock), c.retriesAfterBlock === 0],
    ["Latency · cost", `${(c.ms / 1000).toFixed(1)} s · $${c.cost.toFixed(3)}`, true],
  ] : [];
  return (
    <div className="board evals">
      <div className="crud-head">
        <span className="lbl">Evals · last run</span>
        {c ? <span className={`verdict ${c.pass ? "ok" : "bad"}`}>{c.pass ? "PASS" : "FAIL"} · {c.mode}</span> : <span className="verdict">{running ? "scoring…" : "no runs"}</span>}
      </div>
      {rows.map(([k, v, ok]) => <div className={`erow ${ok ? "" : "bad"}`} key={k}><span>{k}</span><span>{v}</span></div>)}
      {history.length ? (
        <div className="hist">{history.map((h) => <span key={h.ts} className={h.pass ? "ok" : "bad"} title={`${h.mode} · ${new Date(h.ts).toLocaleTimeString("en-IN")}`}>{h.mode[0].toUpperCase()}</span>)}</div>
      ) : null}
    </div>
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
    <div className="board crud payees">
      <div className="crud-head"><span className="lbl">Approved payees</span><button onClick={() => open()} aria-label="Add payee"><Plus size={16} /></button></div>
      {edit === "" ? editor : null}
      {vendors.map((v) => edit === v.upi ? <div key={v.upi}>{editor}</div> : (
        <div className="crud-row" key={v.upi}>
          <span><b>{v.name}</b><code>{v.upi}</code></span>
          <button onClick={() => open(v)} aria-label={`Edit ${v.name}`}><Pencil size={15} /></button>
          <button onClick={() => send(`/api/vendors?upi=${encodeURIComponent(v.upi)}`, "DELETE")} aria-label={`Delete ${v.name}`}><Trash2 size={15} /></button>
        </div>
      ))}
    </div>
  );
}

// Inbox: what the agent reads. Anything here is untrusted tool output, never authorization.
function Inbox({ inbox }: { inbox: Email[] }) {
  const [edit, setEdit] = useState<string | null>(null); // id being edited, "" = new
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
    <div className="board crud inbox">
      <div className="crud-head"><span className="lbl">Inbox · untrusted</span><button onClick={() => open()} aria-label="Add email"><Plus size={16} /></button></div>
      {edit === "" ? editor : null}
      {inbox.map((m) => edit === m.id ? <div key={m.id}>{editor}</div> : (
        <div className="crud-row" key={m.id}>
          <span><b>{m.subject || m.id}</b><code>{m.from}</code></span>
          <button onClick={() => open(m)} aria-label={`Edit ${m.subject}`}><Pencil size={15} /></button>
          <button onClick={() => send(`/api/inbox?id=${encodeURIComponent(m.id)}`, "DELETE")} aria-label={`Delete ${m.subject}`}><Trash2 size={15} /></button>
        </div>
      ))}
    </div>
  );
}

function PayBoard({ p }: { p: Payout }) {
  const stamp = { checking: "CHECKING", blocked: "BLOCKED", paid: "PAID", lost: "LOST" }[p.status];
  const budget = budgetAmount(p.human);
  return (
    <div className={`pay ${p.status}`}>
      <div className="stamp">{stamp}</div>
      <div className="body">
        <div className="amt">{inr(p.amount)}</div>
        <div className="who">→ {p.to}{p.memo ? ` · ${p.memo}` : ""}</div>
        {p.status === "blocked" || p.status === "lost" ? (
          <div className="why">
            {p.source ? <><Mail size={16} />Introduced by <b>{p.source}</b>. </> : null}{p.status === "lost" ? "Failproof would have blocked this." : p.source ? "Not an approved payee." : p.reason}
          </div>
        ) : p.human || p.vendor ? (
          <div className="why">
            {budget ? <><User size={16} /> Within the {budget} you approved</> : null}
            {budget && p.vendor ? " · " : null}
            {p.vendor ? <><BadgeCheck size={16} /> {p.vendor}</> : null}
          </div>
        ) : null}
        {p.checks ? (
          <div className="pol"><ShieldCheck size={14} /> Failproof AI · {p.policy ?? `${p.checks} policy checks passed`}</div>
        ) : null}
      </div>
    </div>
  );
}
