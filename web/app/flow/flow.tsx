"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import {
  ArrowCounterClockwiseIcon, ArrowsLeftRightIcon, BroadcastIcon, CaretLeftIcon, CaretRightIcon, CloudIcon, CursorClickIcon, DatabaseIcon,
  EnvelopeIcon, GlobeIcon, HardDrivesIcon, MonitorIcon, PauseIcon, PlayIcon, RobotIcon, ShieldCheckIcon, TerminalWindowIcon, type Icon,
} from "@phosphor-icons/react";
import fpIcon from "./brand/fp-icon.svg";
import { EDGES, GATES, KINDS, NODES, REGISTRY, SCENARIOS, STEPS, TRACE, type Kind, type NodeId, type Scenario } from "./data";

const ICON: Record<Kind, Icon> = { ui: CursorClickIcon, api: ArrowsLeftRightIcon, sse: BroadcastIcon, net: GlobeIcon, spawn: TerminalWindowIcon, db: DatabaseIcon, fp: ShieldCheckIcon };
const NODE_ICON: Record<NodeId, Icon> = { browser: MonitorIcon, next: HardDrivesIcon, claude: RobotIcon, anthropic: GlobeIcon, gmail: EnvelopeIcon, fp: ShieldCheckIcon, cloud: CloudIcon, pay: TerminalWindowIcon, files: DatabaseIcon };
const pad = (n: number) => String(n).padStart(2, "0");
const inr = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });

// Failproof AI's own mark wherever Failproof AI is the thing doing the work.
const FP_NODES: NodeId[] = ["fp", "cloud"];
function NodeMark({ id, size }: { id: NodeId; size: number }) {
  if (FP_NODES.includes(id)) return <Image src={fpIcon} alt="" width={size} height={size} />;
  const Mark = NODE_ICON[id];
  return <Mark size={size} />;
}

export function KindTag({ k }: { k: Kind }) {
  const Icon = ICON[k];
  return <span className={`kt k-${k}`}>{k === "fp" ? <Image src={fpIcon} alt="" width={14} height={14} /> : <Icon size={13} aria-hidden="true" />}{KINDS[k]}</span>;
}

// ---------- Architecture map: ambient packets on every wire, or one Enforce run traced edge by edge ----------
export function ArchMap() {
  const [sel, setSel] = useState<NodeId>("fp");
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep((s) => (s + 1) % TRACE.length), 1900);
    return () => clearInterval(t);
  }, [playing]);
  const active = step >= 0 ? TRACE[step].edge : null;
  const node = NODES.find((n) => n.id === sel)!;
  const pick = (id: NodeId) => (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(id); } };

  return (
    <div className="map">
      <div className="bar">
        <button className="btn ink" onClick={() => { if (step < 0) setStep(0); setPlaying(!playing); }}>
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} weight="fill" />}{playing ? "Pause" : step < 0 ? "Trace one Enforce run" : "Resume"}
        </button>
        {step >= 0 ? <button className="btn" onClick={() => { setPlaying(false); setStep(-1); }}><ArrowCounterClockwiseIcon size={16} />Show all wires</button> : null}
        {step >= 0 ? <span className="now" aria-live="polite"><b>{pad(step + 1)}</b> {TRACE[step].text}</span> : <span className="hint">Click any box for what runs there.</span>}
      </div>
      <div className="mapwrap">
        <svg viewBox="0 0 1200 720" role="img" aria-label="Architecture: browser, Next.js server, Claude Code, Anthropic API, Failproof AI, mock UPI rail, Gmail and the treasury files">
          <defs>
            {(Object.keys(KINDS) as Kind[]).map((k) => (
              <marker key={k} id={`ah-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className={`ah k-${k}`} />
              </marker>
            ))}
          </defs>
          {EDGES.map((e) => {
            const state = active ? (active === e.id ? "on" : "dim") : "";
            return (
              <g key={e.id} className={`edge k-${e.kind} ${state}`}>
                <path d={e.d} markerEnd={`url(#ah-${e.kind})`} />
                <text x={e.lx} y={e.ly} textAnchor={e.anchor ?? "middle"}>{e.label}</text>
                {state !== "dim" ? (
                  <circle r={state === "on" ? 7 : 4.5} className="pk" key={`${e.id}-${step}`}>
                    <animateMotion dur={state === "on" ? "1.1s" : "2.8s"} repeatCount="indefinite" path={e.d} />
                  </circle>
                ) : null}
              </g>
            );
          })}
          {NODES.map((n) => {
            return (
              <g key={n.id} className={`node k-${n.kind} ${sel === n.id ? "sel" : ""}`} role="button" tabIndex={0} aria-label={`${n.title}: ${n.sub}`} aria-pressed={sel === n.id}
                onClick={() => setSel(n.id)} onKeyDown={pick(n.id)}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="14" />
                <foreignObject x={n.x} y={n.y} width={n.w} height={n.h}>
                  <div className="nb">
                    <span className="h"><span className={`ni ${FP_NODES.includes(n.id) ? "fpbg" : ""}`}><NodeMark id={n.id} size={18} /></span><b>{n.title}</b></span>
                    <small>{n.sub}</small>
                    {n.lines ? <ul>{n.lines.map((l) => <li key={l}>{l}</li>)}</ul> : null}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mapfoot">
        <article className="nodecard" aria-live="polite">
          <header><span className={`ni k-${node.kind} ${FP_NODES.includes(node.id) ? "fpbg" : ""}`}><NodeMark id={node.id} size={20} /></span><div><b>{node.title}</b><small>{node.sub}</small></div></header>
          <p>{node.body}</p>
          <div className="codes">{node.code.map((c) => <code key={c}>{c}</code>)}</div>
        </article>
        <ol className="trace" aria-label="One Enforce run, call by call">
          {TRACE.map((t, i) => {
            const e = EDGES.find((x) => x.id === t.edge)!;
            return (
              <li key={i} className={i === step ? "on" : i < step ? "done" : ""}>
                <button onClick={() => { setPlaying(false); setStep(i); }}>
                  <span className="n">{pad(i + 1)}</span><span className={`dot k-${e.kind}`} title={KINDS[e.kind]} />{t.text}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// ---------- Walkthrough: real screenshots, numbered hotspots, a handwritten note on the active one ----------
export function Tour() {
  const [i, setI] = useState(0);
  const [spot, setSpot] = useState(0);
  const [playing, setPlaying] = useState(false);
  const s = STEPS[i];
  const sp = s.spots[spot];
  const go = (n: number) => { setI((n + STEPS.length) % STEPS.length); setSpot(0); };
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (spot + 1 < STEPS[i].spots.length) setSpot(spot + 1);
      else { setI((i + 1) % STEPS.length); setSpot(0); }
    }, 3200);
    return () => clearTimeout(t);
  }, [playing, i, spot]);

  const [x, y, w, h] = sp.box;
  // Beside the box when there is room, so the note never covers another pin; otherwise below or above it.
  const side = x + w < 68 ? "right" : x > 32 ? "left" : y + h < 84 ? "below" : "above";
  const note = side === "right" ? { left: `${x + w + 1.5}%`, top: `${Math.min(y, 78)}%` }
    : side === "left" ? { right: `${100 - x + 1.5}%`, top: `${Math.min(y, 78)}%` }
    : side === "below" ? { left: `${Math.min(x, 68)}%`, top: `${y + h + 1.2}%` } : { left: `${Math.min(x, 68)}%`, bottom: `${100 - y + 1.2}%` };
  const arrow = { right: "← ", left: "", below: "↑ ", above: "" }[side];
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(i + 1);
    if (e.key === "ArrowLeft") go(i - 1);
  };

  return (
    <div className="tour" onKeyDown={key}>
      <div className="steps" role="tablist" aria-label="Walkthrough steps">
        {STEPS.map((t, n) => (
          <button key={t.id} role="tab" aria-selected={n === i} onClick={() => { setPlaying(false); go(n); }}>
            <span>{pad(n + 1)}</span>{t.short}
          </button>
        ))}
      </div>
      <div className="tourgrid">
        <div className="stage">
          <div className="shot" key={s.id}>
            <Image src={s.img} alt={`Screenshot of ${s.route}: ${s.title}`} placeholder="blur" sizes="(max-width: 1100px) 100vw, 62vw" priority={i === 0} />
            <svg className="ants" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path className="dim" d={`M0 0H100V100H0Z M${x} ${y}h${w}v${h}h${-w}Z`} fillRule="evenodd" />
              {s.spots.map((p, n) => (
                <rect key={n} x={p.box[0]} y={p.box[1]} width={p.box[2]} height={p.box[3]} rx="0.6" className={n === spot ? "on" : ""} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
            {s.spots.map((p, n) => (
              <button key={n} className={`pin ${n === spot ? "on" : ""}`} style={{ left: `${p.box[0]}%`, top: `${p.box[1]}%` }}
                onClick={() => { setPlaying(false); setSpot(n); }} aria-label={`${n + 1}: ${p.title}`}>{n + 1}</button>
            ))}
            <p className="hand" style={note} key={`${s.id}-${spot}`}>{arrow}{sp.note}{side === "left" ? " →" : side === "above" ? " ↓" : ""}</p>
          </div>
          <div className="ctl">
            <button className="btn" onClick={() => { setPlaying(false); go(i - 1); }} aria-label="Previous step"><CaretLeftIcon size={18} /></button>
            <button className="btn ink" onClick={() => setPlaying(!playing)}>{playing ? <PauseIcon size={16} /> : <PlayIcon size={16} weight="fill" />}{playing ? "Pause tour" : "Play tour"}</button>
            <button className="btn" onClick={() => { setPlaying(false); go(i + 1); }} aria-label="Next step"><CaretRightIcon size={18} /></button>
            <span className="hint">← → keys work too</span>
          </div>
        </div>
        <article className="panel" aria-live="polite">
          <div className="meta"><span>{pad(i + 1)} / {STEPS.length}</span><code>{s.route}</code></div>
          <h3>{s.title}</h3>
          <p className="lede">{s.lede}</p>
          <ol className="spots">
            {s.spots.map((p, n) => (
              <li key={n} className={n === spot ? "on" : ""}>
                <button onClick={() => { setPlaying(false); setSpot(n); }} onMouseEnter={() => !playing && setSpot(n)}>
                  <span className="n">{n + 1}</span><b>{p.title}</b>
                </button>
                {n === spot ? <p>{p.body}</p> : null}
              </li>
            ))}
          </ol>
          <h4>Calls in this step</h4>
          <ul className="calls">
            {s.calls.map((c, n) => <li key={n}><KindTag k={c.kind} /><span>{c.text}</span>{c.code ? <code>{c.code}</code> : null}</li>)}
          </ul>
        </article>
      </div>
    </div>
  );
}

// ---------- Policy gauntlet: one tool call through the 8 policies, in file order ----------
type Mode = "observe" | "enforce";
type Result = { st: "pass" | "skip" | "deny" | "would" | "unreached"; reason?: string };

function evaluate(sc: Scenario, mode: Mode) {
  let stopped = false;
  const gates: Result[] = sc.gates.map((g, n) => {
    if (stopped) return { st: "unreached" };
    if (g === "pass" || g === "skip") return { st: g };
    // the sandbox and the kill switch deny in observe mode too
    if (mode === "enforce" || GATES[n].hard) { stopped = true; return { st: "deny", reason: g }; }
    return { st: "would", reason: g };
  });
  const deny = gates.findIndex((r) => r.st === "deny");
  const would = gates.findIndex((r) => r.st === "would");
  return { gates, deny, would, last: deny >= 0 ? deny + 1 : gates.length };
}
// Fraud blocked in enforce, lost in observe; a clean invoice paid in both.
console.assert(evaluate(SCENARIOS[0], "enforce").deny === 3 && evaluate(SCENARIOS[0], "observe").deny === -1 && evaluate(SCENARIOS[1], "enforce").deny === -1, "evaluate");

const MARK = { pass: "✓", skip: "·", deny: "✗", would: "!", unreached: "–" };
const LABEL = { pass: "passed", skip: "no finding", deny: "blocked", would: "would block", unreached: "not reached" };

export function Gauntlet() {
  const [id, setId] = useState(SCENARIOS[0].id);
  const [mode, setMode] = useState<Mode>("enforce");
  const [pos, setPos] = useState(0);
  const sc = SCENARIOS.find((x) => x.id === id)!;
  const r = evaluate(sc, mode);
  useEffect(() => {
    if (pos >= r.last) return;
    const t = setTimeout(() => setPos(pos + 1), 430);
    return () => clearTimeout(t);
  }, [pos, r.last]);
  const done = pos >= r.last;
  const cur = Math.min(pos, r.last) - 1;
  const outcome = r.deny >= 0 ? "blocked" : r.would >= 0 ? (sc.observe ? "flagged" : "lost") : "paid";
  const restart = () => setPos(0);

  return (
    <div className="gaunt">
      <div className="bar">
        <div className="seg pick" role="group" aria-label="Scenario">
          {SCENARIOS.map((x) => <button key={x.id} aria-pressed={x.id === id} onClick={() => { setId(x.id); restart(); }}>{x.label}</button>)}
        </div>
        <div className="seg mode" role="group" aria-label="Mode">
          {(["observe", "enforce"] as const).map((m) => <button key={m} aria-pressed={m === mode} onClick={() => { setMode(m); restart(); }}>{m === "observe" ? "Observe" : "Enforce"}</button>)}
        </div>
        <button className="btn" onClick={restart}><ArrowCounterClockwiseIcon size={16} />Replay</button>
      </div>
      <div className="said"><span>Human said</span><q>{sc.said}</q></div>
      <div className="cmd"><span>Claude Code wants to run · PreToolUse · Bash</span><code>$ {sc.cmd}</code></div>
      <div className="track">
        <span className={`token ${done ? outcome : ""}`} style={{ left: `${Math.max(0, (cur + 0.5) * 12.5)}%` }} aria-hidden="true">{sc.amount ? inr(sc.amount).replace(/\.00$/, "") : "cmd"}</span>
        {GATES.map((g, n) => {
          const res = n < pos ? r.gates[n] : null;
          return (
            <div key={g.name} className={`gate ${res?.st ?? "wait"} ${n === cur && !done ? "now" : ""}`}>
              <span className="ord">{n + 1}</span>
              <b>{g.name}</b>
              {g.hard ? <small className="hard">denies in Observe too</small> : null}
              <span className="res" aria-label={res ? LABEL[res.st] : "waiting"}>{res ? <>{MARK[res.st]} {LABEL[res.st]}</> : "…"}</span>
            </div>
          );
        })}
      </div>
      <div className={`outcome ${done ? "show" : ""}`} aria-live="polite">
        {done ? (
          <>
            <span className={`stamp ${outcome === "flagged" ? "" : outcome}`}>{outcome === "flagged" ? "Would block" : outcome}</span>
            {r.deny >= 0 ? (
              <div>
                <p>Failproof AI stopped the call at <b>{GATES[r.deny].name}</b>. The rail never runs. The agent gets this back as its tool result:</p>
                <code>Blocked by Failproof AI (treasury-{GATES[r.deny].name}): {r.gates[r.deny].reason}</code>
              </div>
            ) : r.would >= 0 ? (
              <div>
                <p>Observe mode logs <b>would-deny</b> from {r.gates.filter((g) => g.st === "would").length === 1 ? "1 policy" : `${r.gates.filter((g) => g.st === "would").length} policies`} and lets the call run. {sc.observe ?? `${inr(sc.amount)} leaves the wallet.`}</p>
                <code>{r.gates[r.would].reason}</code>
              </div>
            ) : (
              <div><p>All 8 policies passed. Bash runs <code>./treasury/bin/pay</code> and {inr(sc.amount)} is debited from ledger.json.</p></div>
            )}
          </>
        ) : <p className="wait">Checking policy {Math.max(1, pos)} of 8…</p>}
      </div>
    </div>
  );
}

// ---------- Every call in the app, filterable by kind ----------
export function Registry() {
  const [k, setK] = useState<Kind | "all">("all");
  const kinds = Object.keys(KINDS) as Kind[];
  const rows = REGISTRY.filter((r) => k === "all" || r.kind === k);
  return (
    <div className="registry">
      <div className="filters" role="group" aria-label="Filter calls by kind">
        <button aria-pressed={k === "all"} onClick={() => setK("all")}>All <i>{REGISTRY.length}</i></button>
        {kinds.map((x) => {
          const Icon = ICON[x];
          return <button key={x} className={`k-${x}`} aria-pressed={k === x} onClick={() => setK(k === x ? "all" : x)}><Icon size={14} />{KINDS[x]} <i>{REGISTRY.filter((r) => r.kind === x).length}</i></button>;
        })}
      </div>
      <div className="rows">
        {rows.map((r) => (
          <div className={`row k-${r.kind}`} key={r.what}>
            <KindTag k={r.kind} />
            <b>{r.what}</b>
            <span>{r.when}</span>
            <code>{r.code}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
