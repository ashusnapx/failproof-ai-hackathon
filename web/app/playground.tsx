"use client";

import { useState } from "react";
import { EnvelopeIcon, UserIcon } from "@phosphor-icons/react";

type Mode = "observe" | "enforce";
const inr = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });

// treasury/vendors.json
const VENDOR_MASTER = ["nammacloud@okhdfcbank", "silkboardlogistics@icici", "s1filterkaapi@ybl"];
// The payouts the agent tried in the 25 Oct 2026 runs, and who put each payee in front of it.
const ATTEMPTS = [
  { name: "Namma Cloud", to: "nammacloud.collect@ybl", amount: 48399, from: "accounts@nammacloud-payments.in" },
  { name: "Silk Board Logistics", to: "silkboardlogistics@icici", amount: 124500, from: "Silk Board vendor portal API" },
  { name: "Sector 1 Filter Kaapi", to: "s1filterkaapi@ybl", amount: 6800, from: "s1filterkaapi@gmail.com" },
];

// The first amount a human wrote: "₹2,00,000", "Rs 50000", "1.5 lakh", "80k". No amount, no budget.
const AMOUNT = /(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?)\s*(lakhs?|lacs?|k|crores?|cr)?|(\d[\d,]*(?:\.\d+)?)\s*(lakhs?|lacs?|k|crores?|cr)\b/i;
function budgetOf(said: string): number | null {
  const m = said.match(AMOUNT);
  if (!m) return null;
  const n = parseFloat((m[1] ?? m[3]).replace(/,/g, ""));
  const unit = (m[2] ?? m[4] ?? "").toLowerCase();
  return Math.round(n * (unit.startsWith("l") ? 1e5 : unit.startsWith("c") ? 1e7 : unit === "k" ? 1e3 : 1));
}
console.assert(budgetOf("Approved budget for this run: ₹2,00,000.") === 200000 && budgetOf("1.5 lakh") === 150000 && budgetOf("pay 3 kaapi bills") === null, "budgetOf");

// The two TruePe policies: payee in the vendor master, total spend inside the budget the human said.
function decide(budget: number | null, mode: Mode) {
  let spent = 0;
  return ATTEMPTS.map((a) => {
    const known = VENDOR_MASTER.includes(a.to);
    const fits = budget !== null && spent + a.amount <= budget;
    const ok = known && fits;
    if (ok || mode === "observe") spent += a.amount;
    const why = !known ? `Payee came from ${a.from}. No human said so.`
      : budget === null ? "You haven't said a budget."
      : fits ? `Inside the ${inr(budget)} you said.` : `Over the ${inr(budget)} you said.`;
    const status = ok ? "paid" : mode === "observe" ? "lost" : "blocked";
    return { ...a, known, status, why: status === "lost" ? `${why} Observe let it through.` : why };
  });
}

export function Playground() {
  const [said, setSaid] = useState("Approved budget for this run: ₹2,00,000.");
  const [mode, setMode] = useState<Mode>("enforce");
  const budget = budgetOf(said);
  const rows = decide(budget, mode);
  const total = (status: string) => inr(rows.filter((r) => r.status === status).reduce((t, r) => t + r.amount, 0));
  return (
    <div className="play">
      <span className="try" aria-hidden="true">go on, change it</span>
      <label htmlFor="said">You say</label>
      <div className="bubble"><textarea id="said" rows={2} spellCheck={false} value={said} onChange={(e) => setSaid(e.target.value)} /></div>
      <p className="heard">{budget === null ? "TruePe heard no amount. Nothing can be paid." : <>TruePe heard a budget of <b>{inr(budget)}</b></>}</p>
      <div className="seg" role="group" aria-label="Mode">
        {(["observe", "enforce"] as const).map((m) => (
          <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m === "observe" ? "Observe" : "Enforce"}</button>
        ))}
      </div>
      <ol className="slips">
        {rows.map((r) => (
          <li className={`slip ${r.status}`} key={r.to}>
            <span className={`stamp ${r.status}`} key={r.status}>{r.status.toUpperCase()}</span>
            <div>
              <b className="amt">{inr(r.amount)}</b>
              <span className="to">→ {r.to} · {r.name}</span>
              <span className="why">{r.known ? <UserIcon size={14} /> : <EnvelopeIcon size={14} />}{r.why}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="tally" aria-live="polite">Paid {total("paid")} · Blocked {total("blocked")} · Lost {total("lost")}</p>
    </div>
  );
}
