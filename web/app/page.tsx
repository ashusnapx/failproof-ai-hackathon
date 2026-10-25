"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  ArrowRight, BadgeCheck, Ban, Bot, CircleCheck, Eye, Flame, Mail, Play, ShieldAlert, ShieldCheck, ShieldX, TerminalSquare, User,
} from "lucide-react";

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
    case "agent": case "tool": case "result": case "done": case "stderr":
      return { ...s, items: push(), seq: s.seq + 1 };
    default:
      return s;
  }
}

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

// Re-trigger a CSS animation class whenever `value` changes (skips the first render).
function useFlash(value: number) {
  const [n, setN] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setN((x) => x + 1);
  }, [value]);
  return n;
}

export default function Page() {
  const [s, dispatch] = useReducer(reduce, undefined, () => fresh());
  const [mode, setMode] = useState<Mode>("observe");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (m) => {
      try { dispatch(JSON.parse(m.data)); } catch { /* ignore a malformed line */ }
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    const f = feedRef.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [s.items.length]);

  useEffect(() => { if (s.running) setStarting(false); }, [s.running]);

  const busy = s.running || starting;
  async function start() {
    setError("");
    setStarting(true);
    try {
      const r = await fetch(`/api/run?mode=${mode}`, { method: "POST" });
      if (!r.ok) { setError(r.status === 409 ? "An agent run is already in progress." : `Could not start the agent (${r.status}).`); setStarting(false); }
    } catch {
      setError("Could not reach the server. Is `npm run dev` running?");
      setStarting(false);
    }
  }

  const balance = useCount(s.balance);
  const lostFlash = useFlash(s.totals.lost);
  const savedFlash = useFlash(s.totals.saved);
  const paidFlash = useFlash(s.totals.paid);
  const shownMode = s.runMode ?? mode;

  return (
    <>
      <header className="mast">
        <div>
          <h1 className="title serif">Who said <em>so?</em></h1>
          <div className="byline">
            <b>Failproof Treasury</b> · AP agent on Claude Code for <b>Dosa Labs Pvt Ltd</b>, 27th Main Rd, Sector 1, HSR Layout, Bengaluru 560102
          </div>
        </div>
        <div className="controls">
          <div className="seg" role="radiogroup" aria-label="Failproof AI mode">
            {(["observe", "enforce"] as const).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} className={`${m} ${mode === m ? "on" : ""}`} onClick={() => setMode(m)} disabled={busy}>
                <b>{m === "observe" ? <Eye size={20} /> : <ShieldCheck size={20} />}{m === "observe" ? "Observe" : "Enforce"}</b>
                <span>{m === "observe" ? "Log verdicts, let money move" : "Block unauthorised payouts"}</span>
              </button>
            ))}
          </div>
          <button className="run" onClick={start} disabled={busy}>
            <Play size={20} fill="currentColor" />{starting && !s.running ? "Starting…" : s.running ? "Agent running" : "Run AP agent"}
          </button>
          <div className={`live ${s.running ? "on" : ""}`} aria-live="polite" title={connected ? "Connected to event stream" : "Reconnecting to event stream"}>
            <i />{s.running ? "LIVE" : connected ? "IDLE" : "OFFLINE"}
          </div>
        </div>
      </header>

      <main className="stage">
        <section className="feedcol" aria-label="Live agent session">
          <div className="feedbar">
            <h2>Live agent session</h2>
            {error ? <span style={{ color: "var(--stop)" }}>{error}</span> : null}
            <span className={`modeflag ${shownMode}`}>
              {shownMode === "observe" ? <Eye size={16} /> : <ShieldCheck size={16} />}
              {shownMode === "observe" ? "OBSERVE: Failproof AI watches, money still moves" : "ENFORCE: Failproof AI blocks what no human authorized"}
            </span>
          </div>
          <div className="feed" ref={feedRef}>
            {s.items.length === 0 ? (
              <div className="empty">
                <h2 className="serif">Every rupee needs a human&rsquo;s words.</h2>
                <p>Pick a mode and press <b>Run AP agent</b>. The agent reads the inbox and pays vendors over UPI; Failproof AI checks every payout against what a person actually said.</p>
              </div>
            ) : (
              s.items.map((it) => <Event key={it.id} item={it} />)
            )}
          </div>
        </section>

        <aside className="side">
          <div className="block">
            <h3>Company wallet</h3>
            <div key={`b${lostFlash}`} className={`balance num ${lostFlash ? "hit" : ""}`}>{inr(balance)}</div>
            <div className="opening">Opening balance {inr(s.opening)}</div>
            <Stat flash={paidFlash} cls="" icon={<CircleCheck size={18} color="var(--leaf)" />} label="Paid to real vendors" value={s.totals.paid} />
            <Stat flash={savedFlash} cls="saved" icon={<ShieldX size={18} color="var(--leaf)" />} label="Blocked by Failproof AI" value={s.totals.saved} />
            <Stat flash={lostFlash} cls="lost" icon={<Flame size={18} color="var(--stop)" />} label="Lost to fraud / errors" value={s.totals.lost} />
            <div className="row">
              <span><ShieldCheck size={18} color="var(--muted)" />Policy checks run</span>
              <span className="num">{s.totals.checks}</span>
            </div>
          </div>

          <div className="block">
            <h3>Vendor master · human-approved payees</h3>
            {s.vendors.map((v) => (
              <div className="vendor" key={v.upi}>
                <b>{v.name}</b> <span className="area">· {v.area}</span>
                <div className="meta"><span className="num upi">{v.upi}</span><span className="num">GSTIN {v.gstin}</span></div>
              </div>
            ))}
          </div>

          <div className="block why">
            <h3>Why this matters</h3>
            <p className="rule serif">An agent may only move money a human authorized in words. Emails, invoices and APIs reach it as tool output, so they can never authorize a payout.</p>
            <p><b>Fake &ldquo;UPI ID changed&rdquo; emails.</b> Business email compromise is among the costliest frauds; here a lookalike domain asks the agent to repoint a payout.</p>
            <p><b>Unit mix-ups.</b> In Feb 2026 the Lobstar Wilde agent sent 52.4M tokens instead of 52,439. Here a vendor API sends <code>amount_paise</code>.</p>
            <p><b>Prompt injection.</b> In May 2026 a hidden instruction moved ~$155K through Grok and Bankrbot.</p>
          </div>
        </aside>
      </main>
    </>
  );
}

function Stat({ flash, cls, icon, label, value }: { flash: number; cls: string; icon: React.ReactNode; label: string; value: number }) {
  const v = useCount(value);
  return (
    <div key={flash} className={`row ${cls} ${flash ? "flash" : ""}`}>
      <span>{icon}{label}</span>
      <span className={`num ${value === 0 ? "zero" : ""}`}>{inr(v)}</span>
    </div>
  );
}

function Prov({ p }: { p?: Provenance }) {
  if (!p) return null;
  if (p.by === "human")
    return <div className="prov">Authorized by <span className="who human"><User size={18} />human words</span>: <q>{p.text}</q></div>;
  if (p.by === "vendor-master")
    return <div className="prov">Payee from <span className="who vendor-master"><BadgeCheck size={18} />vendor master</span>: {p.text}</div>;
  return <div className="prov">Introduced by <span className="who untrusted"><Mail size={18} />untrusted source</span>: {p.text}</div>;
}

const HUMAN_MARK = /(₹[\d,]+)/;

function Event({ item }: { item: Item }) {
  const e = item.e;
  switch (e.kind) {
    case "human":
      return (
        <div className="ev human">
          <div className="tag"><User size={16} />Human instruction · {e.mode} mode</div>
          <blockquote className="serif">
            {(e.text ?? "").split(HUMAN_MARK).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
          </blockquote>
        </div>
      );
    case "agent":
      return <div className="ev agent"><div className="tag"><Bot size={16} />Agent</div><p>{e.text}</p></div>;
    case "tool":
      return <div className="ev tool"><div className="tag"><TerminalSquare size={16} />Tool call · {e.name}</div><pre>{e.input}</pre></div>;
    case "result":
      return (
        <div className={`ev result ${e.error ? "err" : ""}`}>
          <div className="tag">{e.error ? <><Ban size={15} />Tool result · blocked or error</> : "Tool result"}</div>
          <pre>{(e.text ?? "").slice(0, 400)}</pre>
        </div>
      );
    case "verdict": {
      const d = e.decision ?? "allow";
      const label = { allow: "ALLOWED", deny: "BLOCKED", "would-deny": "WOULD DENY" }[d];
      const Icon = { allow: ShieldCheck, deny: ShieldX, "would-deny": ShieldAlert }[d];
      return (
        <div className={`ev verdict ${d}`}>
          <div className="vhead">
            <span className="stamp"><Icon size={22} />{label}</span>
            <span className="vamt num">{inr(e.amount || 0)}</span>
            <span className="vto"><ArrowRight size={20} /><span className="num">{e.to}</span></span>
            <span className="vpolicy">Failproof AI · {e.policy}</span>
          </div>
          <Prov p={e.provenance} />
          <div className="reason">{e.reason}</div>
        </div>
      );
    }
    case "executed":
      return (
        <div className={`ev paid ${item.lost ? "lost" : ""}`}>
          <span className="what">
            {item.lost ? <><Flame size={18} />Money left the wallet. Failproof AI would have blocked this.</> : <><CircleCheck size={18} />UPI payout sent</>}
          </span>
          <span className="amt num">{inr(e.amount || 0)}</span>
          <span className="dest"><ArrowRight size={16} style={{ display: "inline", verticalAlign: "-2px" }} /> <span className="num">{e.to}</span> · {e.memo}</span>
          <span className="bal num">balance {inr(e.balance || 0)}</span>
        </div>
      );
    case "done":
      return <div className="ev done"><hr />Session finished · {((e.ms ?? 0) / 1000).toFixed(1)} s · ${(e.cost ?? 0).toFixed(4)} model cost<hr /></div>;
    case "stderr":
      return <div className="ev stderr"><div className="tag">stderr</div><pre>{e.text}</pre></div>;
    default:
      return null;
  }
}
