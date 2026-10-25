"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowClockwiseIcon, EnvelopeIcon, PlayIcon } from "@phosphor-icons/react";
import "./bills.css";

type Bill = {
  id: string; from: string; subject: string; invoice: string; amount: number | null; upi: string;
  vendor: string | null; status: "ready" | "review" | "suspicious"; note: string; gmail: boolean;
};
const inr = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
const LABEL = { ready: "Ready", review: "Review", suspicious: "Suspicious" };
const STATUSES = ["ready", "review", "suspicious"] as const;

// Fetch -> TruePe pre-screens every bill -> human sets the budget -> Pay runs the agent under Failproof AI policies.
// Rendered as a tab on /live, so the run it starts plays out on the same screen.
export function BillsPanel() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ text: "", err: false });
  const [show, setShow] = useState<"all" | Bill["status"]>("all");

  const refresh = useCallback(async () => {
    const r = await fetch("/api/bills", { cache: "no-store" });
    const j = (await r.json()) as { bills: Bill[] };
    setBills(j.bills);
    const ready = j.bills.filter((b) => b.status === "ready").reduce((s, b) => s + (b.amount ?? 0), 0);
    setBudget((cur) => cur || Math.ceil(ready).toLocaleString("en-IN"));
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh sets state only after its fetch resolves
  useEffect(() => { refresh(); }, [refresh]);

  async function fetchGmail() {
    setBusy("gmail");
    const r = await fetch("/api/gmail", { method: "POST" }).catch(() => null);
    const j = r ? ((await r.json().catch(() => ({}))) as { synced?: number; error?: string }) : { error: "server not reachable" };
    setMsg(j.error ? { text: j.error, err: true } : { text: `Fetched ${j.synced} bill email${j.synced === 1 ? "" : "s"}`, err: false });
    await refresh();
    setBusy("");
  }

  async function pay() {
    setBusy("pay");
    const r = await fetch(`/api/run?mode=enforce&budget=${encodeURIComponent(budget)}`, { method: "POST" });
    setMsg(r.ok ? { text: "Run started: watch the payouts", err: false } : { text: r.status === 409 ? "A run is already in progress." : `Could not start (${r.status}).`, err: true });
    setBusy("");
  }

  const sum = (s: Bill["status"]) => bills.filter((b) => b.status === s).reduce((t, b) => t + (b.amount ?? 0), 0);
  return (
    <div className="bills embedded">
      <div className="acts">
        <button className="gm" onClick={fetchGmail} disabled={!!busy}><EnvelopeIcon size={15} />{busy === "gmail" ? "Fetching…" : "Fetch from Gmail"}</button>
        <button onClick={refresh} disabled={!!busy} aria-label="Refresh bills"><ArrowClockwiseIcon size={15} /></button>
        <label className="budget">₹<input value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d,]/g, "").slice(0, 12))} aria-label="Approved budget in rupees" /></label>
        <button className="pay" onClick={pay} disabled={!!busy || !budget}><PlayIcon size={15} weight="fill" />Pay with TruePe</button>
      </div>
      <div className="filters" role="group" aria-label="Filter bills">
        <button className="all" aria-pressed={show === "all"} onClick={() => setShow("all")}>All <i>{bills.length}</i></button>
        {STATUSES.map((s) => (
          <button key={s} className={s} aria-pressed={show === s} onClick={() => setShow(show === s ? "all" : s)}>
            {LABEL[s]} <i>{bills.filter((b) => b.status === s).length}</i> <b>{inr(sum(s))}</b>
          </button>
        ))}
      </div>
      {msg.text ? <div className={`msg ${msg.err ? "err" : ""}`}>{msg.text}</div> : null}
      <div className="list">
        {bills.filter((b) => show === "all" || b.status === show).map((b) => (
          <div className={`bill ${b.status}`} key={b.id}>
            <div className="row">
              <span className="pill">{LABEL[b.status]}</span>
              <b className="who">{b.vendor ?? b.subject}</b>
              {b.gmail ? <span className="tag">Gmail</span> : null}
              <span className="amt">{b.amount != null ? inr(b.amount) : "₹ ?"}</span>
            </div>
            <small>{b.invoice || "no invoice no."} · {b.upi || "no UPI"}</small>
            <span className="screen">{b.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
