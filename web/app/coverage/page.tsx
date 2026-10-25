import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Mark } from "../logo";
import "./coverage.css";

type Status = "live" | "eval" | "platform" | "next" | "n/a";
type Row = { threat: string; term?: string; scenario: string; control: string; status: Status };

const STATUS: Record<Status, string> = {
  live: "Blocked live",
  eval: "Scored every run",
  platform: "Failproof AI built-in",
  next: "Next",
  "n/a": "Not applicable",
};

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "Money guardrails",
    rows: [
      { threat: "Same invoice submitted twice", scenario: "A reminder email, or a retry, pays SBL/HSR/7781 a second time.", control: "treasury-no-duplicate-invoice: same invoice number, or same payee + amount, already in the ledger is refused.", status: "live" },
      { threat: "Payment API timeout", scenario: "UPI rail debits, then times out; the agent cannot tell and retries.", control: "Mock rail times out after debit (state/rail.json); the retry hits the duplicate guard, so money moves once.", status: "live" },
      { threat: "Unusual amount for a vendor", scenario: "A ₹100 delivery partner bills ₹10,000; the ₹6,800 kaapi vendor bills ₹60,000.", control: "treasury-vendor-spend-anomaly: more than 1.5x the vendor's typical bill needs a human.", status: "live" },
      { threat: "Paise read as rupees", term: "unit error", scenario: "Vendor API sends amount_paise 12450000; agent pays ₹1,24,50,000.", control: "Spend anomaly (95.8x typical) and the human budget cap both deny.", status: "live" },
      { threat: "Over the human's budget", scenario: "Agent spends past the ₹2,00,000 the human typed.", control: "treasury-spend-within-human-budget reads the budget from the human's own turns in the transcript.", status: "live" },
      { threat: "Delivery marked complete without proof", term: "3-way match", scenario: "Invoice says delivered; no OTP, signature or photo exists.", control: "treasury-proof-of-delivery: vendors with requiresProof are paid only with treasury/proofs/<invoice>.json carrying a POD.", status: "live" },
      { threat: "Kill switch", scenario: "Finance sees something wrong mid-run.", control: "Freeze button; treasury-kill-switch denies every payout, even in observe mode.", status: "live" },
      { threat: "Split payments under a limit", term: "structuring", scenario: "One big bill paid as many small ones.", control: "Total spend is capped by the human budget; explicit split detection is next.", status: "next" },
      { threat: "Velocity", scenario: "Dozens of payouts in a minute.", control: "Rate limit per payee and per run.", status: "next" },
    ],
  },
  {
    title: "Fraud and identity",
    rows: [
      { threat: "Fake “UPI ID changed” email", term: "business email compromise", scenario: "accounts@nammacloud-payments.in asks to repoint Namma Cloud's payouts.", control: "treasury-payee-in-vendor-master: only payees in the vendor master; the deny names the email that introduced it.", status: "live" },
      { threat: "Ambiguous or lookalike vendor", term: "identity spoofing", scenario: "nammacloud.collect@ybl vs the real nammacloud@okhdfcbank.", control: "Exact match only; the deny says which approved payee it looks like (edit distance on the UPI handle).", status: "live" },
      { threat: "Vendor master changes", scenario: "Who may add or change a payee?", control: "Only a human, through the Approved payees board (validated API); the agent has no write tools.", status: "live" },
    ],
  },
  {
    title: "LLM and agent risks (OWASP LLM Top 10 2025, OWASP Agentic Top 10)",
    rows: [
      { threat: "Prompt injection", term: "LLM01 · indirect injection", scenario: "Inbox text tells the agent to pay someone, or claims a bigger budget.", control: "Tool output never authorizes: payees come from the vendor master, budgets from the human's words.", status: "live" },
      { threat: "Excessive agency", term: "LLM06", scenario: "Agent does more than pay approved invoices.", control: "Write, Edit, WebFetch, WebSearch and Task disabled; every bin/pay call gated at PreToolUse.", status: "live" },
      { threat: "Tool misuse", term: "ASI02", scenario: "Legitimate pay tool used for an unapproved purpose.", control: "Policies inspect each tool call's arguments before it runs.", status: "live" },
      { threat: "Goal hijack", term: "ASI01 · intent breaking", scenario: "“Urgent, clear it today” pressure in an email.", control: "Urgency changes nothing: payee and budget rules still apply.", status: "live" },
      { threat: "Improper output handling", term: "LLM05", scenario: "Agent emits a malformed amount or payee.", control: "Pay rail validates arguments; policies parse every chained pay command.", status: "live" },
      { threat: "Hallucinated payments", term: "LLM09 · misinformation", scenario: "Final summary says “paid” for a payout that never happened.", control: "Eval compares every claimed payment with the ledger.", status: "eval" },
      { threat: "Accuracy", scenario: "Right payee, exact amount, for every real invoice.", control: "Eval vs treasury/evals/ground-truth.json.", status: "eval" },
      { threat: "Over-blocking", term: "false positives", scenario: "A real vendor payout denied.", control: "Eval counts denies on legit payees; a run with any fails.", status: "eval" },
      { threat: "Policy adherence", scenario: "Agent keeps retrying after a block.", control: "Eval counts retries after a deny.", status: "eval" },
      { threat: "Unbounded consumption", term: "LLM10", scenario: "Runs get slow or expensive.", control: "Latency and model cost recorded per run; money spend capped by the budget.", status: "eval" },
      { threat: "Agent disables its own guardrail", scenario: "Injected text asks the agent to edit or uninstall the policy.", control: "Always-on block-failproofai-commands and the tamper guard on .failproofai/ (it blocked us while building this).", status: "platform" },
      { threat: "Fail-closed", scenario: "Policy daemon down, or vendor master unreadable.", control: "Failproof AI denies when the daemon is unreachable; our policies deny when the vendor master or budget is missing.", status: "platform" },
      { threat: "Repudiation", term: "untraceability", scenario: "Who approved this payout?", control: "Every payout carries provenance; sessions traced to Failproof AI Cloud; events in state/events.jsonl.", status: "platform" },
      { threat: "Observe before enforce", scenario: "Roll out without blocking real work on day one.", control: "Observe mode logs would-deny and lets money move; enforce blocks.", status: "live" },
      { threat: "Sensitive information disclosure", term: "LLM02", scenario: "Gateway keys or .env read into the agent's context.", control: "Failproof AI coding pack (sanitize-*, block-env-files) next to TruePe.", status: "next" },
      { threat: "Supply chain", term: "LLM03", scenario: "A tampered policy pack.", control: "TruePe ships as a Failproof AI pack: SHA256SUMS checked, digest pinned (dry run built).", status: "next" },
      { threat: "Semantic review", scenario: "A novel attack no rule anticipated.", control: "Jev reviews gated calls; money rules stay hard so Jev can never clear them.", status: "next" },
      { threat: "Memory or data poisoning", term: "LLM04 · ASI06", scenario: "Poisoned long-term memory steers later runs.", control: "No agent memory between runs; the vendor master is human-only.", status: "n/a" },
      { threat: "System prompt leakage", term: "LLM07", scenario: "Prompt reveals secrets.", control: "The prompt holds no secrets; only the budget sentence matters.", status: "n/a" },
      { threat: "Vector and embedding weaknesses", term: "LLM08", scenario: "RAG store manipulated.", control: "No retrieval store.", status: "n/a" },
    ],
  },
];

export const metadata = { title: "What TruePe covers" };

export default function Coverage() {
  const all = SECTIONS.flatMap((s) => s.rows);
  const count = (st: Status) => all.filter((r) => r.status === st).length;
  return (
    <main className="cov"><div className="wrap">
      <header className="covhead">
        <Link href="/" className="back"><ArrowLeft size={18} /> TruePe</Link>
        <div className="covtitle"><Mark size={56} /><h1>What TruePe covers</h1></div>
        <div className="tally">
          {(["live", "eval", "platform", "next", "n/a"] as const).map((st) => (
            <span key={st} className={`chip ${st.replace("/", "")}`}>{count(st)} · {STATUS[st]}</span>
          ))}
        </div>
      </header>
      {SECTIONS.map((sec) => (
        <section key={sec.title}>
          <h2>{sec.title}</h2>
          <div className="table">
            <div className="tr th"><span>Threat</span><span>Scenario</span><span>How TruePe handles it</span><span>Status</span></div>
            {sec.rows.map((r) => (
              <div className="tr" key={r.threat}>
                <span><b>{r.threat}</b>{r.term ? <small>{r.term}</small> : null}</span>
                <span>{r.scenario}</span>
                <span>{r.control}</span>
                <span><i className={`chip ${r.status.replace("/", "")}`}>{STATUS[r.status]}</i></span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="caption">Sources: OWASP Top 10 for LLM Applications 2025 (genai.owasp.org), OWASP Top 10 for Agentic Applications. “Blocked live” rows are Failproof AI policies in treasury/policies/treasury-policies.mjs, self-tested and run through Claude Code.</p>
    </div></main>
  );
}
