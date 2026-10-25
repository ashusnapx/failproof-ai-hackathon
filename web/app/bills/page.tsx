"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Mail, Play, RefreshCw } from "lucide-react";
import { Mark } from "../logo";
import "./bills.css";

type Bill = {
  id: string; from: string; subject: string; invoice: string; amount: number | null; upi: string;
  vendor: string | null; status: "ready" | "review" | "suspicious"; note: string; gmail: boolean;
};
const inr = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
const STAMP = { ready: "READY", review: "REVIEW", suspicious: "SUSPICIOUS" };

// Fetch -> TruePe pre-screens every bill -> human sets the budget -> Pay runs the agent under Failproof AI policies.
export default function Bills() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ text: "", err: false });

  const refresh = useCallback(async () => {
    const r = await fetch("/api/bills", { cache: "no-store" });
    const j = (await r.json()) as { bills: Bill[] };
    setBills(j.bills);
    const ready = j.bills.filter((b) => b.status === "ready").reduce((s, b) => s + (b.amount ?? 0), 0);
    setBudget((cur) => cur || Math.ceil(ready).toLocaleString("en-IN"));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function fetchGmail() {
    setBusy("gmail");
    const r = await fetch("/api/gmail", { method: "POST" }).catch(() => null);
    const j = r ? ((await r.json().catch(() => ({}))) as { synced?: number; error?: string }) : { error: "server not reachable" };
    setMsg(j.error ? { text: j.error, err: true } : { text: `Fetched ${j.synced} bill email${j.synced === 1 ? "" : "s"} from Gmail`, err: false });
    await refresh();
    setBusy("");
  }

  async function pay() {
    setBusy("pay");
    const r = await fetch(`/api/run?mode=enforce&budget=${encodeURIComponent(budget)}`, { method: "POST" });
    if (r.ok) router.push("/live");
    else { setMsg({ text: r.status === 409 ? "A run is already in progress." : `Could not start (${r.status}).`, err: true }); setBusy(""); }
  }

  const sum = (s: Bill["status"]) => bills.filter((b) => b.status === s).reduce((t, b) => t + (b.amount ?? 0), 0);
  return (
    <main className="bills"><div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" aria-label="TruePe home"><Mark size={52} /></Link>
          <div><h1>Bills</h1><Link href="/live">Live run</Link> · <Link href="/coverage">Coverage</Link></div>
        </div>
        <div className="acts">
          <button className="gm" onClick={fetchGmail} disabled={!!busy}><Mail size={16} />{busy === "gmail" ? "Fetching…" : "Fetch from Gmail"}</button>
          <button onClick={refresh} disabled={!!busy}><RefreshCw size={16} />Refresh</button>
          <label className="budget">₹<input value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d,]/g, "").slice(0, 12))} aria-label="Approved budget in rupees" /></label>
          <button className="pay" onClick={pay} disabled={!!busy || !budget}><Play size={16} fill="currentColor" />{busy === "pay" ? "Starting…" : "Pay with TruePe"}</button>
        </div>
      </div>
      <div className="sum">
        <span>Ready <b>{inr(sum("ready"))}</b></span>
        <span>Review <b>{inr(sum("review"))}</b></span>
        <span>Suspicious <b>{inr(sum("suspicious"))}</b></span>
        {msg.text ? <span className={`msg ${msg.err ? "err" : ""}`}>{msg.text}</span> : null}
      </div>
      <div className="grid">
        {bills.map((b) => (
          <div className={`bill ${b.status}`} key={b.id}>
            <div className="stamp">{STAMP[b.status]}</div>
            <div className="body">
              <b>{b.vendor ?? b.subject}{b.gmail ? <span className="tag">Gmail</span> : null}</b>
              <small>{b.invoice || "no invoice no."} · {b.upi || "no UPI"} · {b.from}</small>
              <span>{b.note}</span>
            </div>
            <div className="amt">{b.amount != null ? inr(b.amount) : "₹ ?"}</div>
          </div>
        ))}
      </div>
    </div></main>
  );
}
