import Link from "next/link";
import { ArrowRight, BadgeCheck, Ban, Building2, Mail, ShieldCheck, Store, Truck, User, Wallet } from "lucide-react";
import { COMPETITORS, WINS } from "./competitors";
import { Mark } from "./logo";

const STEPS = [
  { icon: User, title: "You say it", body: "“Approved budget for this run: ₹2,00,000.” Only your words authorize money.", tone: "cream" },
  { icon: Mail, title: "Agent reads the inbox", body: "Invoices, emails, vendor APIs. All untrusted. None of it can authorize a rupee.", tone: "wall" },
  { icon: ShieldCheck, title: "TruePe checks the payout", body: "At the tool call, before money moves: approved payee? inside your budget?", tone: "sign" },
  { icon: BadgeCheck, title: "Paid or blocked", body: "Every payout shows who said so: your sentence, the vendor master, or the email that tried.", tone: "enamel" },
];

const WHO = [
  { icon: Building2, title: "Startup finance teams", body: "AP agents paying cloud, logistics and office vendors over UPI." },
  { icon: Store, title: "Marketplaces", body: "Seller payouts and refunds where one fake bank-change email costs lakhs." },
  { icon: Truck, title: "Logistics & D2C", body: "Daily COD remittances and vendor settlements run by agents." },
  { icon: Wallet, title: "Fintech platforms", body: "Agentic payouts with an audit trail a regulator can read." },
];

const INCIDENTS = [
  { when: "Feb 2026", what: "Lobstar Wilde agent sent 52.4M tokens instead of 52,439 after losing state." },
  { when: "May 2026", what: "A hidden instruction posted on X moved ~$155K through Grok and Bankrbot." },
  { when: "Every week", what: "“Our UPI ID changed” emails from lookalike domains repoint vendor payouts." },
];

export default function Landing() {
  return (
    <main className="L">
      <section className="hero">
        <div className="sign">
          <span className="mark"><Mark size={72} /></span>
          <span className="kn">ಯಾರು ಹೇಳಿದರು?</span>
          <h1>TruePe</h1>
          <p className="tag">Your AI agent pays only what a human said.</p>
          <div className="ctas">
            <Link className="btn red" href="/live">Watch it live <ArrowRight size={20} /></Link>
            <a className="btn ink" href="#compare">TruePe vs others</a>
          </div>
        </div>
        <div className="proof">
          <div className="pay blocked"><div className="stamp">BLOCKED</div><div className="body">
            <div className="amt">₹48,399.00</div><div className="who">→ nammacloud.collect@ybl</div>
            <div className="why"><Mail size={16} />Introduced by <b>accounts@nammacloud-payments.in</b>. No human said so.</div></div></div>
          <div className="pay paid"><div className="stamp">PAID</div><div className="body">
            <div className="amt">₹1,24,500.00</div><div className="who">→ silkboardlogistics@icici</div>
            <div className="why"><User size={16} /> Within the ₹2,00,000 you approved</div></div></div>
          <p className="caption">Real run, 25 Oct 2026, Claude Code agent + Failproof AI hooks. 25 s, $0.07.</p>
        </div>
      </section>

      <section className="steps">
        {STEPS.map(({ icon: Icon, title, body, tone }) => (
          <div className={`step ${tone}`} key={title}><Icon size={28} /><h3>{title}</h3><p>{body}</p></div>
        ))}
      </section>

      <section className="who">
        <h2>Who it&rsquo;s for</h2>
        <div className="grid">
          {WHO.map(({ icon: Icon, title, body }) => (
            <div className="whocard" key={title}><Icon size={24} /><b>{title}</b><span>{body}</span></div>
          ))}
        </div>
      </section>

      {COMPETITORS.length ? (
        <section className="compare" id="compare">
          <h2>TruePe vs the rest</h2>
          <div className="table">
            <div className="tr th"><span>Product</span><span>What it does well</span><span>What TruePe adds</span></div>
            {COMPETITORS.map((c) => (
              <div className="tr" key={c.name}><span><b>{c.name}</b><small>{c.what}</small></span><span>{c.good}</span><span>{c.gap}</span></div>
            ))}
          </div>
          <div className="wins">
            {WINS.map((w) => <div className="win" key={w.title}><ShieldCheck size={22} /><b>{w.title}</b><span>{w.body}</span></div>)}
          </div>
        </section>
      ) : null}

      <section className="incidents">
        <h2><Ban size={28} /> Agents already lose money</h2>
        {INCIDENTS.map((i) => <div className="inc" key={i.when}><b>{i.when}</b><span>{i.what}</span></div>)}
      </section>

      <footer className="foot">
        <span><b>TruePe</b> · built on Failproof AI policies + Claude Code · HSR Layout, Bengaluru</span>
        <Link className="btn red" href="/live">Run the live demo <ArrowRight size={18} /></Link>
      </footer>
    </main>
  );
}
