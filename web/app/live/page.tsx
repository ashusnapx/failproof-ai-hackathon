"use client";

import { Fragment, use, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CaretDownIcon, CaretUpIcon, CheckIcon, CheckCircleIcon, CircleNotchIcon, EnvelopeIcon, HandPalmIcon, PencilSimpleIcon, PlayIcon, PlusIcon, RobotIcon, SealCheckIcon, ShieldWarningIcon, SlidersHorizontalIcon, SnowflakeIcon, StopIcon, TrashIcon, UserIcon, WarningIcon, XIcon, XCircleIcon } from "@phosphor-icons/react";
import { Mark } from "../logo";
import { BillsPanel } from "../bills/panel";
import { split } from "../truepe-ai";
import { ConsoleDrawer, type ConsoleTab } from "./console";
import "./live.css";

type Mode = "observe" | "enforce";
type Decision = "allow" | "deny" | "would-deny" | "instruct";
type Vendor = { name: string; upi: string; gstin: string; area: string };
type Provenance = { by: "human" | "vendor-master" | "untrusted" | "ledger"; text: string };
type Policy = { name: string; description: string };
// One SSE event, exactly as written to treasury/state/events.jsonl (plus hello/reset/ledger from the stream).
type Ev = {
  kind: string; ts?: number; text?: string; mode?: Mode; name?: string; input?: string; error?: boolean;
  policy?: string; decision?: Decision; to?: string; amount?: number; memo?: string;
  reason?: string; provenance?: Provenance; balance?: number; running?: boolean; cost?: number; ms?: number;
  vendors?: { vendors: Vendor[] }; opening?: number; chat?: boolean;
};
type Item = { id: number; e: Ev; lost?: boolean };
type State = {
  vendors: Vendor[]; opening: number; items: Item[]; flagged: string[];
  totals: { paid: number; saved: number; lost: number; checks: number };
  balance: number; running: boolean; runMode: Mode | null; seq: number; ended: boolean;
};
// fp: Failproof AI's own hook decisions for the live session, read from its Activity log (lib/failproof.ts)
type Data = { vendors: Vendor[]; inbox: Email[]; frozen: boolean; frozenBy: string | null; history: Card[]; policies: Policy[]; fp: { decision: string }[] };

const inr = (n: number) => Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const inr0 = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const short = (policy: string) => policy.replace(/^treasury-/, "");
const OPENING = 2500000;
const fresh = (s: Partial<State> = {}): State => ({
  vendors: [], opening: OPENING, items: [], flagged: [], totals: { paid: 0, saved: 0, lost: 0, checks: 0 },
  balance: OPENING, running: false, runMode: null, seq: 0, ended: false, ...s,
});

// Same bookkeeping as treasury/ui.html: deny = saved (once per payee+amount); executed after a would-deny = lost.
function reduce(s: State, e: Ev): State {
  const push = (lost?: boolean): Item[] => [...s.items, { id: s.seq, e, lost }];
  // After "done" only the scorecard belongs to this run: later verdicts come from other Claude sessions on this machine.
  if (s.ended && !["hello", "reset", "ledger", "eval", "human"].includes(e.kind)) return s;
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
      return { ...s, items: push(), seq: s.seq + 1, runMode: e.mode ?? s.runMode, ended: false };
    case "done":
      return { ...s, items: push(), seq: s.seq + 1, ended: true };
    case "agent": case "tool": case "result": case "stderr": case "eval":
      return { ...s, items: push(), seq: s.seq + 1 };
    default:
      return s;
  }
}

// One slip per payout attempt (every verdict and the execution for the same payee + amount).
// Verdicts that name no payee (the agent sandbox, a command that only mentions bin/pay) become notes, not payouts.
type Check = { policy: string; decision: Decision; reason?: string; by?: Provenance["by"]; text?: string };
type Payout = {
  key: string; note?: boolean; to: string; amount: number; memo: string; command?: string;
  status: "checking" | "blocked" | "paid" | "lost";
  human?: string; vendor?: string; source?: string; reason?: string; policy?: string; checks: Check[];
  result?: string; error?: boolean; balance?: number; ts?: number;
};
// Payee + rupees of a bin/pay command, parsed like the policies do, so a tool call, its verdicts and its result share one key.
function payKey(command: string) {
  const to = command.match(/--to\s+["']?([^"'\s]+)/)?.[1];
  const amount = Number(command.match(/--amount\s+["']?([^"'\s]+)/)?.[1]?.replace(/[₹,]|rs\.?/gi, ""));
  return to && amount ? `${to}|${amount}` : null;
}
function payouts(items: Item[]): Payout[] {
  const map = new Map<string, Payout>();
  const commands = new Map<string, string>();
  // Tool results come back in tool-call order, also when the agent fires several pays at once.
  const calls: (string | null)[] = [];
  for (const { e, lost } of items) {
    if (e.kind === "tool") {
      const key = /bin\/pay/.test(String(e.input)) ? payKey(String(e.input)) : null;
      if (key) commands.set(key, String(e.input));
      calls.push(key);
    }
    if (e.kind === "result") {
      const p = map.get(calls.shift() ?? "");
      if (p) { p.result = e.text; p.error = e.error; }
    }
    if (e.kind !== "verdict" && e.kind !== "executed") continue;
    if (e.kind === "verdict" && !e.to) {
      map.set(`n${e.ts}${e.policy}`, { key: `n${e.ts}${e.policy}`, note: true, to: "", amount: 0, memo: "", status: "blocked", reason: e.reason?.trim(), policy: e.policy, checks: [] });
      continue;
    }
    const key = `${e.to}|${e.amount}`;
    const p = map.get(key) ?? { key, to: e.to ?? "", amount: e.amount ?? 0, memo: "", status: "checking" as const, checks: [], ts: e.ts };
    if (e.memo) p.memo = e.memo;
    if (e.kind === "executed") { p.status = lost ? "lost" : "paid"; p.balance = e.balance; }
    else {
      p.command ??= commands.get(key);
      p.checks = [...p.checks.filter((c) => c.policy !== e.policy), { policy: e.policy ?? "", decision: e.decision ?? "allow", reason: e.reason, by: e.provenance?.by, text: e.provenance?.text }];
      const by = e.provenance?.by;
      if (by === "human") p.human = e.provenance?.text;
      if (by === "vendor-master") p.vendor = e.provenance?.text;
      if (by === "untrusted") p.source = e.provenance?.text.replace(/\s*\(.*\)$/, "");
      // a warning (instruct) lets the payout continue, so it never becomes the slip's block reason
      if ((e.decision === "deny" || e.decision === "would-deny") && !p.reason) { p.reason = e.reason; p.policy = e.policy; }
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

export default function Page({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const run = use(searchParams).run ?? null; // /live?run=<id>: a saved run, read-only
  const [s, dispatch] = useReducer(reduce, undefined, () => fresh());
  const [mode, setMode] = useState<Mode>("observe");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState("2,00,000");
  const [data, setData] = useState<Data>({ vendors: [], inbox: [], frozen: false, frozenBy: null, history: [], policies: [], fp: [] });
  const feedRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Set<string>>(new Set()); // payouts whose full Failproof checks are expanded
  const [drawer, setDrawer] = useState<ConsoleTab | null>(null); // budgets / rules / packs console

  useEffect(() => {
    const es = new EventSource(run ? `/api/stream?run=${encodeURIComponent(run)}` : "/api/stream");
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data);
        if (e.kind === "data") setData({ vendors: e.vendors, inbox: e.inbox, frozen: !!e.frozen, frozenBy: e.frozenBy ?? null, history: e.history ?? [], policies: e.policies ?? [], fp: e.fp ?? [] });
        else {
          if (e.kind === "ledger" && e.running) setStarting(false);
          dispatch(e);
        }
      } catch { /* ignore a malformed line */ }
    };
    return () => es.close();
  }, [run]);

  const list = payouts(s.items);
  useEffect(() => {
    const f = feedRef.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [s.seq]);

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
  // One turn per human message: what they said (TruePe AI chat), the payouts it led to, and the Run's report once done.
  const turns: Item[][] = [];
  for (const it of s.items) {
    if (it.e.kind === "human" || !turns.length) turns.push([]);
    turns.at(-1)!.push(it);
  }
  const chatting = s.items.some((i) => i.e.chat);

  const balance = useCount(s.balance);
  // The budget sentence Failproof read back from the transcript (the kill switch is also "human", but carries no budget).
  const said = budgetLine([...s.items].reverse().find((i) => i.e.provenance?.by === "human" && /budget|₹/i.test(i.e.provenance.text))?.e.provenance?.text);
  const now = activity(s.items, busy);
  const done = s.items.some((i) => i.e.kind === "done");
  const auto = data.frozenBy?.startsWith("auto");
  const state = error ? "error" : busy ? "live" : done ? "done" : "idle";
  const count = (st: Payout["status"]) => list.filter((p) => !p.note && p.status === st).length;
  const payKeys = list.filter((p) => !p.note).map((p) => p.key);
  const allOpen = payKeys.length > 0 && payKeys.every((k) => open.has(k));
  const toggle = (k: string) => setOpen((o) => { const n = new Set(o); if (!n.delete(k)) n.add(k); return n; });
  const spent: Record<string, number> = {};
  for (const { e } of s.items) if (e.kind === "executed" && e.to) spent[e.to] = (spent[e.to] ?? 0) + (e.amount ?? 0);

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
          <button className="groups" onClick={() => setDrawer("budgets")} title="Split the budget by group and vendor"><SlidersHorizontalIcon size={16} />Budgets</button>
          <div className="seg" role="group" aria-label="Mode">
            {(["observe", "enforce"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} disabled={busy} aria-pressed={mode === m} title={m === "observe" ? "Failproof only watches: would-block payouts still go through" : "Failproof blocks payouts nobody authorized"}>
                {m === "observe" ? "Observe" : "Enforce"}
              </button>
            ))}
          </div>
          {/* Stop only once the agent really runs, so the second click of a double-click on Run lands on "Starting", not Stop.
              /api/chat/stop ends whichever agent is running, a run or a chat turn; payouts already made stay in the ledger. */}
          {s.running ? (
            <button className="go stop" onClick={() => fetch("/api/chat/stop", { method: "POST" }).catch(() => setError("Server not reachable."))} disabled={!!run}>
              <StopIcon size={16} weight="fill" />Stop
            </button>
          ) : (
            <button className="go" onClick={start} disabled={busy || !!run}>{busy ? <CircleNotchIcon size={16} className="spin" /> : <PlayIcon size={16} weight="fill" />}{busy ? "Starting" : "Run"}</button>
          )}
        </div>
        <div className="right">
          {run ? <a className="saved" href="/live">Saved run · {new Date(Number(run)).toLocaleString("en-IN")} · Back to live</a> : null}
          <span className={`status ${state}`} role="status"><i />{error || now || "Ready"}</span>
          <button className={`freeze ${data.frozen ? "on" : ""}`} onClick={() => send("/api/freeze", "POST", { frozen: !data.frozen })}>
            <SnowflakeIcon size={16} />{data.frozen ? "Unfreeze" : "Freeze"}
          </button>
        </div>
      </header>

      <section className="kpis" aria-label="Money">
        <div><small>Company wallet</small><b>{inr0(balance)}</b></div>
        <div className="paid"><small>Paid to vendors</small><b>{inr0(s.totals.paid)}</b></div>
        {/* Failproof AI's own count from its Activity log; a saved run is not in that log, so it counts the run's deny verdicts */}
        <div className="guard" title={run ? "Deny verdicts in this saved run" : "From Failproof AI's Activity log for this session"}>
          <small>Blocked by Failproof AI</small>
          <b>{run ? s.items.filter((i) => i.e.kind === "verdict" && i.e.decision === "deny").length : data.fp.filter((d) => d.decision === "deny").length}</b>
          {run ? null : <small>of {data.fp.length} tool calls checked</small>}
        </div>
        <div className={s.totals.lost ? "lost" : ""}><small>Lost to fraud</small><b>{inr0(s.totals.lost)}</b></div>
        <div className="said"><small><UserIcon size={13} /> Who said so</small>{said ? <q>{said}</q> : <span>No human words read yet</span>}</div>
      </section>

      <div className="main">
        <div className="feed-head">
          <h2>Payout attempts</h2>
          {list.length ? <span className="counts">{count("paid")} paid · {count("blocked")} blocked{count("lost") ? ` · ${count("lost")} lost` : ""}</span> : null}
          {payKeys.length ? <button className="more" onClick={() => setOpen(allOpen ? new Set() : new Set(payKeys))}>{allOpen ? "Hide all details" : "Show all details"}</button> : null}
        </div>
        <section className="feed" ref={feedRef}>
          {data.frozen ? (
            <div className="frozen"><SnowflakeIcon size={20} /> All payouts frozen {auto ? <>by Failproof AI <small>{data.frozenBy?.replace(/^auto:\s*/, "")}</small></> : "by a human"}</div>
          ) : null}
          {list.length === 0 && !chatting ? (
            <div className="empty">
              <Mark size={44} />
              <b>{busy ? "Waiting for the first payout…" : "No payouts yet"}</b>
              <span>{busy ? "The agent is reading the inbox. Every payout it tries shows up here with Failproof AI's verdict." : "Set the budget the agent may spend, pick Observe (watch only) or Enforce (Failproof blocks), then press Run. Or ask TruePe AI, bottom right."}</span>
            </div>
          ) : null}
          {turns.map((t) => {
            // the run's report, or TruePe AI's reply without its ACTION lines (those are buttons in the TruePe AI window)
            const done = t.some((i) => i.e.kind === "done");
            const reply = done ? split(t.findLast((i) => i.e.kind === "agent")?.e.text ?? "") : null;
            const pays = payouts(t);
            // a stopped or killed run never logs "done": it has ended once the agent is no longer running it
            const ended = done || !(s.running && t === turns.at(-1));
            const table = ended ? pays.filter((p) => !p.note) : [];
            return (
              <Fragment key={t[0].id}>
                {t[0].e.chat ? <p className="you"><UserIcon size={15} /> {t[0].e.text}</p> : null}
                {pays.map((p) => (p.note ? <Note key={p.key} p={p} policies={data.policies} /> : <Slip key={p.key} p={p} policies={data.policies} open={open.has(p.key)} onToggle={() => toggle(p.key)} />))}
                {t[0].e.chat && !done && s.running && t === turns.at(-1) ? <p className="ai-wait"><CircleNotchIcon size={14} className="spin" /> TruePe AI is working…</p> : null}
                {table.length ? <RunTable list={table} /> : null}
                {reply?.text ? <Report text={reply.text} lost={list.filter((p) => p.status === "lost").map((p) => p.to)} label={t[0].e.chat ? "TruePe AI" : undefined} collapsed={table.length > 0} /> : null}
                {reply?.actions.length ? (
                  <button className="ai-acts" onClick={() => window.dispatchEvent(new Event("truepe-ai:open"))}>
                    {reply.actions.length} action{reply.actions.length > 1 ? "s" : ""} waiting for your approval · open TruePe AI
                  </button>
                ) : null}
              </Fragment>
            );
          })}
        </section>
      </div>

      <aside className="side">
        <Evals card={(s.items.findLast((i) => i.e.kind === "eval")?.e as unknown as Card) ?? null} history={data.history} running={busy} />
        <Tabs data={data} items={s.items} onAdd={() => setDrawer("rules")} />
      </aside>
      {drawer ? (
        <ConsoleDrawer tab={drawer} onTab={setDrawer} onClose={() => setDrawer(null)} vendors={data.vendors} spent={spent} budget={budget}
          attempts={list.filter((p) => !p.note).map((p) => ({ to: p.to, amount: p.amount, memo: p.memo, ts: p.ts }))}
          installed={data.policies.some((p) => p.name === "treasury-group-budgets")} />
      ) : null}
    </main>
  );
}

type Email = { id: string; from: string; subject: string; body: string };
type Card = {
  ts: number; mode: string; pass: boolean; fraudAttempts: number; fraudBlocked: number; fraudLost: number;
  legit: number; legitPaid: number; wrongAmount: number; overBlocks: number; hallucinations: string[];
  retriesAfterBlock: number; cost: number; ms: number; run?: string;
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
      {c?.run ? <a className="permalink" href={`/live?run=${c.run}`}>Link to this run</a> : null}
      {rows.length ? <div className="metrics">{rows.map(([k, v, ok]) => <span className={ok ? "" : "bad"} key={k} title={v}><small>{k}</small><b>{v}</b></span>)}</div> : null}
      {history.length ? (
        <div className="hist" aria-label="Last runs">{history.map((h) => {
          const title = `${h.pass ? "pass" : "fail"} · ${h.mode} · ${new Date(h.ts).toLocaleTimeString("en-IN")}`;
          return h.run
            ? <a key={h.ts} href={`/live?run=${h.run}`} className={h.pass ? "ok" : "bad"} title={`${title} · open this run`}>{h.mode[0].toUpperCase()}</a>
            : <span key={h.ts} className={h.pass ? "ok" : "bad"} title={title}>{h.mode[0].toUpperCase()}</span>;
        })}</div>
      ) : null}
    </div>
  );
}

// Policies, payees and inbox share one card. Panels stay mounted so Gmail sync keeps running on any tab.
function Tabs({ data, items, onAdd }: { data: Data; items: Item[]; onAdd: () => void }) {
  const [tab, setTab] = useState<"bills" | "policies" | "payees" | "inbox">("bills");
  const tabs = [["bills", "Bills", data.inbox.length], ["policies", "Policies", data.policies.length], ["payees", "Payees", data.vendors.length], ["inbox", "Inbox", data.inbox.length]] as const;
  return (
    <div className="card tabs">
      <div className="tablist" role="tablist">
        {tabs.map(([id, label, n]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}<i>{n}</i></button>)}
      </div>
      <div className="panel" role="tabpanel" hidden={tab !== "bills"}><BillsPanel /></div>
      <div className="panel" role="tabpanel" hidden={tab !== "policies"}><Policies policies={data.policies} items={items} onAdd={onAdd} /></div>
      <div className="panel" role="tabpanel" hidden={tab !== "payees"}><Payees vendors={data.vendors} /></div>
      <div className="panel" role="tabpanel" hidden={tab !== "inbox"}><Inbox inbox={data.inbox} /></div>
    </div>
  );
}

// The policy set Failproof AI loads from .failproofai/policies, with this run's decisions per policy.
function Policies({ policies, items, onAdd }: { policies: Policy[]; items: Item[]; onAdd: () => void }) {
  const tally = new Map<string, Partial<Record<Decision, number>>>();
  for (const { e } of items) {
    if (e.kind !== "verdict" || !e.policy || !e.decision) continue;
    const t = tally.get(e.policy) ?? {};
    t[e.decision] = (t[e.decision] ?? 0) + 1;
    tally.set(e.policy, t);
  }
  return (
    <>
      <button className="addpol" onClick={onAdd}><PlusIcon size={15} /> Add policy · rules, budgets, Failproof AI packs</button>
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
              {t.instruct ? <i className="would-deny">{t.instruct} warned</i> : null}
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
      <button onClick={save} aria-label="Save"><CheckIcon size={16} /></button>
      <button onClick={() => setEdit(null)} aria-label="Cancel"><XIcon size={16} /></button>
      {err ? <div className="crud-err">{err}</div> : null}
    </div>
  );
  return (
    <>
      <div className="crud-head"><span className="lbl">Read by payee-in-vendor-master</span><button onClick={() => open()} aria-label="Add payee"><PlusIcon size={16} /></button></div>
      {edit === "" ? editor : null}
      {vendors.map((v) => edit === v.upi ? <div key={v.upi}>{editor}</div> : (
        <div className="crud-row" key={v.upi}>
          <span><b>{v.name}</b><code>{v.upi}</code></span>
          <button onClick={() => open(v)} aria-label={`Edit ${v.name}`}><PencilSimpleIcon size={15} /></button>
          <button onClick={() => send(`/api/vendors?upi=${encodeURIComponent(v.upi)}`, "DELETE")} aria-label={`Delete ${v.name}`}><TrashIcon size={15} /></button>
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
      <button onClick={save} aria-label="Save"><CheckIcon size={16} /></button>
      <button onClick={() => setEdit(null)} aria-label="Cancel"><XIcon size={16} /></button>
      {err ? <div className="crud-err">{err}</div> : null}
    </div>
  );
  return (
    <>
      <div className="crud-head">
        <span className="lbl untrusted">Untrusted · never authorizes</span>
        <span className="gm">
          <button className={`gmail ${live ? "on" : ""}`} onClick={() => setLive(!live)} aria-pressed={live} title="Pull the newest payment emails from Gmail every 15 s">Gmail{live ? " ●" : ""}</button>
          <button onClick={() => open()} aria-label="Add email"><PlusIcon size={16} /></button>
        </span>
      </div>
      {gmErr ? <div className="crud-err">{gmErr}</div> : null}
      {edit === "" ? editor : null}
      {inbox.map((m) => edit === m.id ? <div key={m.id}>{editor}</div> : (
        <div className="crud-row" key={m.id}>
          <span><b>{m.subject || m.id}</b><code>{m.from}</code></span>
          <button onClick={() => open(m)} aria-label={`Edit ${m.subject}`}><PencilSimpleIcon size={15} /></button>
          <button onClick={() => send(`/api/inbox?id=${encodeURIComponent(m.id)}`, "DELETE")} aria-label={`Delete ${m.subject}`}><TrashIcon size={15} /></button>
        </div>
      ))}
    </>
  );
}

const BADGE = {
  checking: <><CircleNotchIcon size={14} className="spin" /> Checking</>,
  blocked: <><ShieldWarningIcon size={14} /> Blocked</>,
  paid: <><CheckCircleIcon size={14} /> Paid</>,
  lost: <><WarningIcon size={14} /> Lost</>,
};

const RESULT: Record<Decision, string> = { allow: "Passed", deny: "Blocked", "would-deny": "Would block", instruct: "Warned the agent" };
const BY: Record<Provenance["by"], string> = { human: "Your words", "vendor-master": "Vendor master", untrusted: "Untrusted source", ledger: "Ledger" };
const rank = (d: Decision) => ({ deny: 0, "would-deny": 1, instruct: 2, allow: 3 })[d];
const ICON = { allow: <CheckIcon size={12} />, deny: <XIcon size={12} />, "would-deny": <WarningIcon size={12} />, instruct: <WarningIcon size={12} />, skip: null };

// Every policy Failproof AI runs on this payout: logged verdicts with their reason and evidence first, then the
// policies that stayed silent. Policies only log a finding, so money that moved means every silent one passed.
type Row = { policy: string; cls: Decision | "skip"; label: string; reason: string; evidence?: string };
function checkRows(p: Payout, policies: Policy[]): Row[] {
  const moved = p.status === "paid" || p.status === "lost";
  const logged = [...p.checks].sort((a, b) => rank(a.decision) - rank(b.decision)).map((c): Row => ({
    policy: c.policy, cls: c.decision, label: c.decision === "would-deny" ? "Would block (observe)" : RESULT[c.decision],
    reason: c.reason?.trim() ?? "", evidence: c.by ? `${BY[c.by]}: ${c.text}` : undefined,
  }));
  const silent = policies.filter((x) => !p.checks.some((c) => c.policy === x.name)).map((x): Row => ({
    policy: x.name, cls: moved ? "allow" : "skip", label: moved ? "Passed · no finding" : p.status === "blocked" ? "No finding: call already blocked" : "Pending", reason: x.description,
  }));
  return [...logged, ...silent];
}
const tip = (r: Row) => `${r.policy} · ${r.label}\n${r.reason}${r.evidence ? `\n${r.evidence}` : ""}`;

function Audit({ p, policies }: { p: Payout; policies: Policy[] }) {
  return (
    <div className="audit">
      {p.command ? <div className="cmd"><span>Failproof AI intercepted · PreToolUse · Bash</span><code>$ {p.command}</code></div> : null}
      <ol>
        {checkRows(p, policies).map((r) => (
          <li key={r.policy} className={r.cls}>
            <span className="res">{ICON[r.cls]}{r.label}</span>
            <b>{short(r.policy)}</b>
            <p>{r.reason}</p>
            {r.evidence ? <small>{r.evidence}</small> : null}
          </li>
        ))}
      </ol>
      {p.result ? (
        <div className={`cmd rail ${p.error ? "bad" : ""}`}>
          <span>{p.error ? "What the agent got back" : `UPI rail${p.balance !== undefined ? ` · wallet ${inr(p.balance)} after` : ""}`}</span>
          <code>{p.result}</code>
        </div>
      ) : null}
    </div>
  );
}

function Slip({ p, policies, open, onToggle }: { p: Payout; policies: Policy[]; open: boolean; onToggle: () => void }) {
  const budget = budgetAmount(p.human);
  // Failproof's deny reason is also the agent's instruction: first sentence is the why, the rest tells the agent what to do.
  const [why, ...rest] = (p.reason ?? "").split(/(?<=\.)\s+/);
  const told = rest.filter((r) => !r.startsWith("It came from")).join(" ");
  const rows = checkRows(p, policies);
  // the cards where Failproof AI stepped in; hovering names the exact policy and its reason
  const hits = rows.filter((r) => r.cls === "deny" || r.cls === "would-deny");
  return (
    <article className={`slip ${p.status}`}>
      <div className="line">
        <span className={`badge ${p.status}`}>{BADGE[p.status]}</span>
        <b className="amt">{inr(p.amount)}</b>
        <code className="to">→ {p.to}</code>
        {hits.length ? (
          <span className={`fp ${p.status}`} data-tip={hits.map(tip).join("\n\n")}>
            <ShieldWarningIcon size={14} />{p.status === "blocked" ? "Blocked by Failproof AI" : "Flagged by Failproof AI"} · {hits.map((r) => short(r.policy)).join(", ")}
          </span>
        ) : null}
        {p.memo ? <span className="memo">{p.memo}</span> : null}
      </div>
      <div className="body">
        {p.status === "blocked" || p.status === "lost" ? (
          <p className="why bad">
            {p.source ? <><EnvelopeIcon size={15} /> From <b>{p.source}</b>. </> : null}{why}
            {p.status === "lost" ? " Observe mode only watches, so the payout went through. Run in Enforce and Failproof AI blocks it." : ""}
          </p>
        ) : p.human || p.vendor ? (
          <p className="why">
            {budget ? <><UserIcon size={15} /> Within the {budget} you approved</> : null}
            {budget && p.vendor ? " · " : null}
            {p.vendor ? <><SealCheckIcon size={15} /> {p.vendor}</> : null}
          </p>
        ) : null}
        {p.status === "blocked" && told ? <p className="told"><RobotIcon size={14} /> Failproof told the agent: {told}</p> : null}
        <div className="checkrow">
          <ul className="checks" aria-label={`Failproof AI ran ${rows.length} checks`}>
            {rows.map((r) => <li key={r.policy} className={r.cls} data-tip={tip(r)}>{ICON[r.cls]}{short(r.policy)}</li>)}
          </ul>
          {rows.length ? (
            <button className="more" onClick={onToggle} aria-expanded={open}>
              {open ? <>Hide details <CaretUpIcon size={14} /></> : <>Details <CaretDownIcon size={14} /></>}
            </button>
          ) : null}
        </div>
        {open ? <Audit p={p} policies={policies} /> : null}
      </div>
    </article>
  );
}

// The agent's closing summary, one row per line: its own ✓ ✗ ⚠ marks (or paid / blocked words) pick the icon and the
// text before the first ": " is the vendor. These are the agent's words, so a line naming a payee the ledger shows
// as lost to fraud gets flagged instead of a green tick.
const REPORT_KIND: [RegExp, "ok" | "bad" | "warn"][] = [
  [/^(✓|✔|✅)/u, "ok"], [/^(✗|✘|❌)/u, "bad"], [/^⚠/u, "warn"],
  [/\b(block(ed)?|denied|refused)\b/i, "bad"], [/\b(reject(ed)?|hold|review|skipp?(ed)?|not pa(id|ying))\b/i, "warn"], [/\b(paid|sent)\b/i, "ok"],
];
const REPORT_ICON = { ok: <CheckCircleIcon size={18} weight="fill" />, bad: <XCircleIcon size={18} weight="fill" />, warn: <WarningIcon size={18} weight="fill" />, lost: <ShieldWarningIcon size={18} weight="fill" /> };
// collapsed: under a RunTable, the agent's own words are a click away; the table already has the payouts
function Report({ text, lost, label, collapsed }: { text: string; lost: string[]; label?: string; collapsed?: boolean }) {
  const lines = text.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").split("\n").map((l) => l.replace(/^\s*(?:[-*•]|\d+\.)\s+/, "").trim()).filter(Boolean);
  const Box = collapsed ? "details" : "div";
  const Head = collapsed ? "summary" : "span";
  return (
    <Box className="report">
      <Head className="lbl"><RobotIcon size={14} /> {label ?? <>The agent&rsquo;s report to you</>}</Head>
      <ul>
        {lines.map((line, i) => {
          if (/^(status|total|summary|budget)\b/i.test(line)) return <li key={i} className="sum">{line}</li>;
          const kind = lost.some((to) => line.includes(to)) ? "lost" : REPORT_KIND.find(([re]) => re.test(line))?.[1];
          if (!kind) return <li key={i} className="plain">{line}</li>;
          const clean = line.replace(/^(✓|✔|✅|✗|✘|❌|⚠️?)\s*/u, "");
          const cut = clean.indexOf(": ");
          return (
            <li key={i} className={kind}>
              {REPORT_ICON[kind]}
              <span>
                {cut > 0 && cut < 60 ? <><b>{clean.slice(0, cut)}</b>{clean.slice(cut + 2)}</> : clean}
                {kind === "lost" ? <em>The ledger shows this payee is not in the vendor master: lost to fraud.</em> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </Box>
  );
}

// The run's payouts as one colour-coded table, built from the ledger and Failproof AI's verdicts (not the agent's
// words): what moved, what a human must decide, what a policy blocked, what the kill switch froze, what was lost.
type RowKind = "paid" | "human" | "blocked" | "frozen" | "lost" | "checking";
const ROW: Record<RowKind, { label: string; icon: ReactNode }> = {
  paid: { label: "Paid", icon: <CheckCircleIcon size={16} weight="fill" /> },
  human: { label: "Needs a human", icon: <HandPalmIcon size={16} weight="fill" /> },
  blocked: { label: "Blocked", icon: <ShieldWarningIcon size={16} weight="fill" /> },
  frozen: { label: "Frozen", icon: <SnowflakeIcon size={16} weight="bold" /> },
  lost: { label: "Lost", icon: <WarningIcon size={16} weight="fill" /> },
  checking: { label: "Checking", icon: <CircleNotchIcon size={16} className="spin" /> },
};
// denials a human can lift (approve the amount, raise the budget, record the delivery) rather than outright refusals
const NEEDS_HUMAN = ["treasury-vendor-spend-anomaly", "treasury-spend-within-human-budget", "treasury-group-budgets", "treasury-proof-of-delivery"];
const rowKind = (p: Payout): RowKind =>
  p.status !== "blocked" ? p.status : p.policy === "treasury-kill-switch" ? "frozen" : NEEDS_HUMAN.includes(p.policy ?? "") ? "human" : "blocked";

function RunTable({ list }: { list: Payout[] }) {
  const rows = list.map((p) => ({ p, k: rowKind(p) }));
  const of = (k: RowKind) => rows.filter((r) => r.k === k);
  const order: RowKind[] = ["paid", "human", "blocked", "frozen", "lost"];
  return (
    <div className="runtable">
      <div className="rt-sum">
        {order.filter((k) => of(k).length).map((k) => (
          <span key={k} className={`rt-chip k-${k}`}>{ROW[k].icon}<b>{of(k).length}</b> {ROW[k].label.toLowerCase()} · {inr0(of(k).reduce((s, r) => s + r.p.amount, 0))}</span>
        ))}
      </div>
      <table>
        <thead><tr><th>Status</th><th>Invoice</th><th className="num">Amount</th><th>Payee</th><th>Why</th></tr></thead>
        <tbody>
          {rows.map(({ p, k }) => (
            <tr key={p.key} className={`k-${k}`}>
              <td><span className={`rt-badge k-${k}`}>{ROW[k].icon}{ROW[k].label}</span></td>
              <td><code>{p.memo || "—"}</code></td>
              <td className="num">{inr(p.amount)}</td>
              <td><code>{p.to}</code>{p.vendor ? <small>{p.vendor}</small> : null}</td>
              <td>
                {k === "paid" ? "Every Failproof AI check passed"
                  : <><b>{short(p.policy ?? "")}</b> {(p.reason ?? "").split(/(?<=\.)\s+/)[0]}{k === "lost" ? " Observe mode let it through." : ""}</>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// A policy decision with no payout behind it: the agent sandbox, or a command that names no payee.
function Note({ p, policies }: { p: Payout; policies: Policy[] }) {
  const desc = policies.find((x) => x.name === p.policy)?.description;
  return (
    <div className="note">
      <ShieldWarningIcon size={16} />
      <span><b data-tip={`${p.policy} · Blocked${desc ? `\n${desc}` : ""}`}>Failproof AI · {short(p.policy ?? "")}</b> {p.reason}</span>
    </div>
  );
}
