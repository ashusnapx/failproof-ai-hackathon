"use client";

// TruePe AI: a chat window on every page. The human's messages go to the same Claude AP agent /live runs, under the
// same Failproof AI policies. The agent reads treasury/ and pays; anything else it wants done comes back as an
// ACTION line, shown here as a card that does nothing until the human clicks it.
// Every number shown is read, never estimated: cost from Claude Code's own result, checks and blocks from Failproof
// AI's Activity log, payouts from the ledger, action outcomes from the server.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowClockwiseIcon, ArrowDownIcon, ArrowsInSimpleIcon, ArrowsOutSimpleIcon, CaretLeftIcon, CheckCircleIcon, CheckIcon, CircleNotchIcon, CopyIcon,
  NotePencilIcon, PaperPlaneRightIcon, ShieldCheckIcon, ShieldWarningIcon, SidebarSimpleIcon, SnowflakeIcon, StopIcon, WarningCircleIcon, XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { Mark } from "./logo";
import fpIcon from "./flow/brand/fp-icon.svg";
import "./truepe-ai.css";

type Ev = { kind: string; ts?: number; text?: string; chat?: boolean; name?: string; input?: string; to?: string; amount?: number; memo?: string; cost?: number; ms?: number; running?: boolean; frozen?: boolean; fp?: Fp[] };
// one Failproof AI hook decision, as lib/failproof.ts reads it from Failproof AI's Activity log
type Fp = { ts: number; tool: string | null; policy: string | null; decision: string; reason: string | null; ms: number };
type Action = { type: string; [k: string]: unknown };
type ChatMeta = { id: string; title: string; ts: number; messages: number; cost: number };
type Turn = { ts: number; chat: boolean; text: string; reply: string[]; paid: Ev[]; checks: Fp[]; errors: string[]; tool?: Ev; done: boolean; cost?: number; ms?: number };

const PAGES = ["/", "/live", "/coverage", "/flow"];
const MAX = 2000;
const inr = (n?: number | null) => "₹" + Number(n ?? 0).toLocaleString("en-IN");
const usd = (n?: number) => `$${(n ?? 0).toFixed((n ?? 0) < 0.1 ? 4 : 2)}`;
const time = (ts?: number) => (ts ? new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");
const stamp = (ts: number) => new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const short = (p: string | null) => (p ?? "").replace(/^.*\//, "").replace(/^treasury-/, "");

// The "/" menu: one command per thing the site can really do. Choosing one only fills the box (a prompt ending in a
// space or ₹ waits for the human to finish it, so no budget or payee is ever typed for them); /new and /stop act at once.
type Command = { group: string; cmd: string; hint: string; prompt?: string; act?: "new" | "stop" };
const COMMANDS: Command[] = [
  { group: "Bills & payouts", cmd: "bills", hint: "Which bills came in, and which look risky", prompt: "What bills came in, and which look risky?" },
  // shortcut: only commands tested end to end before the demo; /pay, /policies, /phish, /demo, /open etc. come back once tested
  { group: "Guardrails", cmd: "budget", hint: "Set a group or vendor budget", prompt: "Set the budget for " },
  { group: "Guardrails", cmd: "approve", hint: "Approve a payee (you confirm with a click)", prompt: "Approve payee " },
  { group: "Guardrails", cmd: "remove-payee", hint: "Remove an approved payee", prompt: "Remove payee " },
  { group: "Guardrails", cmd: "rule", hint: "Add a payout rule, e.g. over ₹50,000 on weekends", prompt: "Add a rule: block payouts " },
  { group: "Guardrails", cmd: "freeze", hint: "Stop every payout now", prompt: "Freeze all payouts now." },
  { group: "Guardrails", cmd: "unfreeze", hint: "Let payouts resume", prompt: "Unfreeze payouts." },
  { group: "Chat", cmd: "new", hint: "Start a new chat", act: "new" },
  { group: "Chat", cmd: "stop", hint: "Stop TruePe AI's current reply", act: "stop" },
];
function commands(msg: string) {
  if (!msg.startsWith("/") || msg.includes("\n")) return null;
  const q = msg.slice(1).trim().toLowerCase();
  return COMMANDS.filter((c) => c.cmd.startsWith(q) || c.hint.toLowerCase().includes(q));
}

// One turn per human message: the agent's final words (narration before a tool call is dropped), the ledger's payouts,
// and every Failproof AI decision made while the turn ran.
function toTurns(events: Ev[], fp: Fp[]): Turn[] {
  const out: Turn[] = [];
  for (const e of events) {
    if (e.kind === "human") { out.push({ ts: e.ts ?? 0, chat: !!e.chat, text: e.text ?? "", reply: [], paid: [], checks: [], errors: [], done: false }); continue; }
    const t = out.at(-1);
    if (!t) continue;
    if (e.kind === "agent" && e.text) t.reply.push(e.text);
    if (e.kind === "tool") { t.reply = []; t.tool = e; }
    if (e.kind === "executed") t.paid.push(e);
    if (e.kind === "stderr" && e.text) t.errors.push(e.text);
    if (e.kind === "done") { t.done = true; t.cost = e.cost; t.ms = e.ms; }
  }
  for (const d of fp) out.findLast((t) => t.ts <= d.ts)?.checks.push(d);
  return out;
}

// The reply without its ACTION lines (and any code fence around them), plus the parsed actions.
export function split(text: string) {
  const actions: Action[] = [];
  const lines = text.split("\n").filter((l) => {
    const m = l.trim().replace(/^`+|`+$/g, "").match(/^ACTION\s+(\{.*\})$/);
    if (m) {
      try {
        const a = JSON.parse(m[1]);
        if (typeof a?.type === "string") actions.push(a);
      } catch { /* a malformed line is dropped, never run */ }
      return false;
    }
    return !/^\s*```\w*\s*$/.test(l);
  });
  return { text: lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(), actions };
}

// Enough Markdown for an agent's reply: paragraphs, bullet and numbered lists, **bold**, `code`. Text only, never HTML.
function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) =>
    p.length > 4 && p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b>
      : p.length > 2 && p.startsWith("`") && p.endsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : p);
}
function Md({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let items: string[] = [];
  const flush = () => {
    if (items.length) out.push(<ul key={out.length}>{items.map((t, i) => <li key={i}>{inline(t)}</li>)}</ul>);
    items = [];
  };
  for (const line of text.split("\n")) {
    const li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
    if (li) { items.push(li[1]); continue; }
    flush();
    if (line.trim()) out.push(<p key={out.length}>{inline(line.replace(/^#+\s*/, ""))}</p>);
  }
  flush();
  return <>{out}</>;
}

// A rule's conditions in words: {"amountOver":50000,"weekend":true} -> "over ₹50,000 · on weekends"
const WHEN: Record<string, (v: unknown) => string> = {
  payee: (v) => `to ${v}`, amountOver: (v) => `over ${inr(Number(v))}`, amountUnder: (v) => `under ${inr(Number(v))}`,
  invoiceNot: (v) => `invoice not matching ${v}`, outside: (v) => `outside ${(v as string[]).join("–")}`, weekend: (v) => (v ? "on weekends" : ""),
};
const when = (w: Record<string, unknown>) => Object.entries(w).map(([k, v]) => WHEN[k]?.(v) ?? `${k} ${v}`).filter(Boolean).join(" · ");

function describe(a: Action): [string, string?] {
  const s = (k: string) => String(a[k] ?? "");
  const rule = (a.rule ?? {}) as { name?: string; action?: string; message?: string; when?: Record<string, unknown> };
  const group = a.group as { name?: string; cap?: number | null } | undefined;
  const vendor = (a.vendor ?? {}) as { upi?: string; group?: string; cap?: number };
  switch (a.type) {
    case "go": return [`Open ${s("path")}`];
    case "freeze": return a.frozen === true ? ["Freeze every payout"] : ["Unfreeze payouts", "Payouts resume for every agent on this machine."];
    case "payee": return [`Approve payee ${s("name")} · ${s("upi")}`, "Confirm this UPI ID with the vendor by phone first: an email can fake it."];
    case "payee-remove": return [`Remove payee ${s("upi")}`];
    case "rule": return [`${rule.action === "warn" ? "Warn on" : "Block"} payouts ${when(rule.when ?? {})}`, `Rule “${rule.name ?? ""}”: ${rule.message ?? ""}`];
    case "rule-remove": return [`Remove rule ${s("id")}`];
    case "budget": return group
      ? [`Set “${group.name ?? ""}” budget to ${group.cap == null ? "no cap" : inr(group.cap)}`]
      : [`${vendor.upi ?? ""}: ${[vendor.group && `group ${vendor.group}`, vendor.cap != null && `cap ${inr(vendor.cap)}`].filter(Boolean).join(" · ")}`];
    case "budget-remove": return [`Remove budget group ${s("id")}`];
    case "pack": return [`Turn on ${s("pack")}: ${(a.policies as string[] | undefined)?.join(", ") || "whole pack"}`];
    case "email": return [`Add test email “${s("subject")}” from ${s("from")}`, s("body").slice(0, 160)];
    case "email-remove": return [`Delete inbox email ${s("id")}`];
    case "run": return [`Restart the AP demo run · ${s("mode") === "observe" ? "Observe" : "Enforce"} · budget ₹${s("budget")}`, "This ends the chat."];
    default: return [`Unknown action ${a.type}`];
  }
}

async function post(url: string, body?: object): Promise<{ error: string; result?: string }> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body && JSON.stringify(body) }).catch(() => null);
  if (!r) return { error: "Server not reachable." };
  const j = (await r.json().catch(() => ({}))) as { error?: string; result?: string };
  if (r.ok) return { error: "", result: j.result };
  return { error: j.error ?? (r.status === 409 ? "TruePe AI is still working on the last message." : `Request failed (${r.status}).`) };
}

function perform(a: Action, go: (path: string) => void): Promise<{ error: string; result?: string }> {
  if (a.type === "go") {
    // only this site's own pages: an ACTION line can never send the human elsewhere
    if (!PAGES.includes(String(a.path))) return Promise.resolve({ error: `There is no page ${a.path}.` });
    go(String(a.path));
    return Promise.resolve({ error: "", result: `Opened ${a.path}` });
  }
  if (a.type === "run") return post(`/api/run?mode=${a.mode === "observe" ? "observe" : "enforce"}&budget=${encodeURIComponent(String(a.budget ?? ""))}`);
  return post("/api/actions", a);
}

// readOnly: a card in a past chat, shown for the record; approving it later would act on a conversation that is over
function Card({ a, go, readOnly }: { a: Action; go: (path: string) => void; readOnly?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "dismissed">("idle");
  const [err, setErr] = useState("");
  const [result, setResult] = useState("");
  const [what, note] = describe(a);
  async function run() {
    setState("busy");
    const r = await perform(a, go);
    setErr(r.error);
    setResult(r.result ?? "");
    setState(r.error ? "idle" : "done");
  }
  if (state === "dismissed") return <div className="act gone">Dismissed: {what}</div>;
  const label = a.type === "go" ? "Open" : a.type === "freeze" ? (a.frozen === true ? "Freeze" : "Unfreeze") : "Approve";
  return (
    <div className={`act ${state}`}>
      <span className="what">{what}</span>
      {note && state !== "done" ? <small>{note}</small> : null}
      {err ? <small className="err"><WarningCircleIcon size={13} /> {err}</small> : null}
      {readOnly ? <small>Proposed in this chat</small> : state === "done" ? <span className="ok"><CheckIcon size={14} /> {result || "Done"}</span> : (
        <span className="btns">
          <button className="yes" onClick={run} disabled={state === "busy"}>{state === "busy" ? <CircleNotchIcon size={14} className="spin" /> : null}{err ? "Retry" : label}</button>
          <button className="no" onClick={() => setState("dismissed")} disabled={state === "busy"}>Dismiss</button>
        </span>
      )}
    </div>
  );
}

function Copy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="meta-btn" title="Copy reply" aria-label="Copy reply"
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }, () => {})}>
      {ok ? <CheckIcon size={13} /> : <CopyIcon size={13} />}{ok ? "Copied" : "Copy"}
    </button>
  );
}

export function TruePeAI() {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(false); // the stream starts on first open and then stays, so a reply can mark unread
  const [big, setBig] = useState(false);
  const [unread, setUnread] = useState(false);
  const [events, setEvents] = useState<Ev[]>([]);
  const [fp, setFp] = useState<Fp[]>([]);
  const [running, setRunning] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<{ text: string; error?: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const [active, setActive] = useState(0); // highlighted row of the "/" menu
  const [side, setSide] = useState(false); // the chats sidebar
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [view, setView] = useState<{ id: string; title: string; events: Ev[] } | null>(null); // a past chat, read-only
  const thread = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);
  const chatTurn = useRef(false);
  const since = useRef(0);

  function toggle(next = !openRef.current) {
    openRef.current = next;
    setOpen(next);
    if (next) { setLive(true); setUnread(false); } else launcher.current?.focus();
  }

  useEffect(() => {
    if (!live) return;
    const es = new EventSource("/api/stream");
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data) as Ev;
        if (e.kind === "hello") { since.current = Date.now(); setEvents([]); }
        else if (e.kind === "reset") setEvents([]);
        else if (e.kind === "ledger") { setRunning(!!e.running); if (e.running) setSending(false); }
        else if (e.kind === "data") { setFrozen(!!e.frozen); setFp(e.fp ?? []); }
        else {
          if (e.kind === "human") { chatTurn.current = !!e.chat; if (e.chat) setPending(null); }
          // a reply that lands while the window is closed (not one replayed on connect) marks the bubble
          if (e.kind === "done" && chatTurn.current && !openRef.current && (e.ts ?? 0) > since.current) setUnread(true);
          setEvents((x) => [...x, e]);
        }
      } catch { /* ignore a malformed line */ }
    };
    return () => es.close();
  }, [live]);

  // ⌘K / Ctrl+K anywhere, and the /live feed's "open in TruePe AI" links
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); toggle(); } };
    const show = () => toggle(true);
    window.addEventListener("keydown", key);
    window.addEventListener("truepe-ai:open", show);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("truepe-ai:open", show); };
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  // the box grows with what is typed, up to six lines
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [msg, open]);

  // a past chat carries Failproof AI's decisions for its session in its last line
  const turns = view
    ? toTurns(view.events.filter((e) => e.kind !== "fp"), (view.events.find((e) => e.kind === "fp") as { list?: Fp[] } | undefined)?.list ?? [])
    : toTurns(events, fp);
  const chatting = turns.some((t) => t.chat) || (!view && !!pending);
  // newest message in view unless the human scrolled up to read; an empty chat keeps its intro at the top
  useEffect(() => {
    const t = thread.current;
    if (!t) return;
    if (!chatting) t.scrollTop = 0;
    else if (atBottom) t.scrollTop = t.scrollHeight;
  }, [events, fp, pending, open, atBottom, chatting]);

  const busy = running || sending;
  const last = turns.at(-1);
  const lastChat = turns.findLast((t) => t.chat);
  async function send(text: string) {
    text = text.trim();
    if (!text || busy) return;
    setPending({ text });
    setMsg("");
    setSending(true);
    setAtBottom(true);
    const r = await post("/api/chat", { message: text });
    if (r.error) { setPending({ text, error: r.error }); setSending(false); }
  }
  async function loadChats() {
    const r = await fetch("/api/chats").then((x) => x.json()).catch(() => null);
    setChats(r?.chats ?? []);
  }
  async function fresh() {
    const r = await fetch("/api/chat", { method: "DELETE" }).catch(() => null);
    if (r?.ok) { setPending(null); setMsg(""); setView(null); loadChats(); }
    else setPending({ text: "", error: "Wait for TruePe AI to finish, or press Stop, then start a new chat." });
  }
  async function show(c: ChatMeta) {
    const r = await fetch(`/api/chats?id=${c.id}`).then((x) => x.json()).catch(() => null);
    if (!r?.events) return;
    setView({ id: c.id, title: c.title, events: r.events });
    setAtBottom(true);
    if (!big) setSide(false); // a small window has no room for both
  }
  function back() {
    setView(null);
    setAtBottom(true);
    if (!big) setSide(false);
  }
  const stop = () => post("/api/chat/stop");
  const menu = commands(msg);
  function choose(c?: Command) {
    if (!c) return;
    if (c.act === "new") { setMsg(""); fresh(); }
    else if (c.act === "stop") { setMsg(""); stop(); }
    else setMsg(c.prompt ?? "");
    input.current?.focus();
  }
  const slash = () => { setMsg("/"); setActive(0); input.current?.focus(); };

  const tool = busy ? last?.tool : undefined;
  const doing = !busy || view ? "" : last && !last.chat ? "The AP demo run is going on /live…"
    : /bin\/pay/.test(String(tool?.input)) ? "Paying over UPI…"
    : tool?.name === "Read" || /^(cat|head|ls|wc)\b/.test(String(tool?.input)) ? `Reading ${String(tool?.input).split(/[\s/]/).pop()}…`
    : sending ? "Sending…" : "Thinking…";
  const total = turns.reduce((s, t) => s + (t.chat ? t.cost ?? 0 : 0), 0);
  const allChecks = turns.flatMap((t) => (t.chat ? t.checks : []));
  const status = view ? `Past chat · ${stamp(Number(view.id))}` : busy ? "Working…" : frozen ? "Payouts frozen" : "Online · Failproof AI enforcing";
  const current = events.find((e) => e.kind === "human" && e.chat)?.text;

  return (
    <div className="tp-ai">
      {open ? (
        <section className={`win ${big ? "big" : ""} ${side ? "side-on" : ""}`} role="dialog" aria-label="TruePe AI" onKeyDown={(e) => { if (e.key === "Escape") toggle(false); }}>
          <header>
            <button className={`icon ${side ? "on" : ""}`} onClick={() => { if (!side) loadChats(); setSide(!side); }} aria-expanded={side}
              title={side ? "Hide chats" : "All chats"} aria-label={side ? "Hide chats" : "All chats"}><SidebarSimpleIcon size={18} /></button>
            <Mark size={32} />
            <div className="who">
              <b>TruePe AI</b>
              <small className={view ? "" : busy ? "busy" : frozen ? "cold" : ""}><i />{status}</small>
            </div>
            {total > 0 ? (
              <span className="cost" title={`What this chat cost on Claude, from Claude Code's own result · Failproof AI checked ${allChecks.length} tool calls, blocked ${allChecks.filter((c) => c.decision === "deny").length}`}>
                {usd(total)}
              </span>
            ) : null}
            <button className="icon" onClick={fresh} disabled={busy || !chatting} title="New chat" aria-label="New chat"><NotePencilIcon size={18} /></button>
            <button className="icon wide" onClick={() => setBig(!big)} title={big ? "Smaller window" : "Bigger window"} aria-label={big ? "Smaller window" : "Bigger window"}>
              {big ? <ArrowsInSimpleIcon size={18} /> : <ArrowsOutSimpleIcon size={18} />}
            </button>
            <button className="icon" onClick={() => toggle(false)} title="Close (Esc)" aria-label="Close TruePe AI"><XIcon size={18} /></button>
          </header>
          <div className="body">
          {side ? (
            <aside className="side" aria-label="Chats">
              <div className="side-head">
                <b>Chats</b>
                <button className="icon" onClick={() => setSide(false)} title="Minimize chats" aria-label="Minimize chats"><CaretLeftIcon size={16} /></button>
              </div>
              <button className="side-new" onClick={fresh} disabled={busy || !chatting}><NotePencilIcon size={16} /> New chat</button>
              <button className={`side-item ${view ? "" : "on"}`} onClick={back}>
                <b>{current ?? "Current chat"}</b><small>{busy ? "Working…" : "Now"}{total ? ` · ${usd(total)}` : ""}</small>
              </button>
              {chats.length ? <span className="grp">Earlier</span> : null}
              {chats.map((c) => (
                <button key={c.id} className={`side-item ${view?.id === c.id ? "on" : ""}`} onClick={() => show(c)} title={c.title}>
                  <b>{c.title || "Untitled chat"}</b><small>{stamp(c.ts)} · {c.messages} message{c.messages === 1 ? "" : "s"}{c.cost ? ` · ${usd(c.cost)}` : ""}</small>
                </button>
              ))}
              {!chats.length ? <p className="side-empty">Chats you finish with New chat appear here.</p> : null}
            </aside>
          ) : null}
          {frozen && !view ? <div className="frozen"><SnowflakeIcon size={15} /> All payouts are frozen. Ask TruePe AI to unfreeze when it is safe.</div> : null}

          <div className="thread" ref={thread} role="log" aria-live="polite"
            onScroll={(e) => { const t = e.currentTarget; setAtBottom(t.scrollHeight - t.scrollTop - t.clientHeight < 60); }}>
            {!chatting ? (
              <div className="bot">
                <Mark size={26} />
                <div className="bub">
                  <p>Hi, I&rsquo;m TruePe AI. I read Dosa Labs&rsquo; bills, pay them within a budget you type, and ask before changing any guardrail. Failproof AI checks every step I take.</p>
                  <p>Type <button className="kbd" onClick={slash}>/</button> to see everything I can do.</p>
                </div>
              </div>
            ) : null}

            {turns.map((t, i) => {
              // a run that was stopped or killed never logs "done": it is only "running" while the agent really is
              if (!t.chat) return <p key={i} className="sys">AP demo run on /live · {t.done ? usd(t.cost) : running && t === last ? "running" : "ended"}</p>;
              const { text, actions } = split(t.reply.join("\n\n"));
              const blocked = t.checks.filter((c) => c.decision === "deny");
              const rows: { ts: number; paid?: Ev; block?: Fp }[] = [...t.paid.map((e) => ({ ts: e.ts ?? 0, paid: e })), ...blocked.map((c) => ({ ts: c.ts, block: c }))].sort((a, b) => a.ts - b.ts);
              const isLast = t === lastChat;
              return (
                <div key={i} className="turn">
                  <p className="me" title={time(t.ts)}>{t.text}</p>
                  {rows.map((r, j) => r.paid
                    ? <p key={j} className="paid"><CheckCircleIcon size={15} weight="fill" /><span>Paid {inr(r.paid.amount)} → {r.paid.to}{r.paid.memo ? ` · ${r.paid.memo}` : ""}</span></p>
                    : <p key={j} className="blocked" title={r.block!.reason ?? ""}><ShieldWarningIcon size={15} weight="fill" /><span><b>Failproof AI blocked {r.block!.tool} · {short(r.block!.policy)}</b> {(r.block!.reason ?? "").replace(/^Blocked by Failproof AI \([^)]*\):\s*/, "").split(/(?<=\.)\s/)[0]}</span></p>)}
                  {t.errors.map((x, j) => <p key={`e${j}`} className="sys err"><WarningCircleIcon size={13} /> {x}</p>)}
                  {t.done || text || actions.length ? (
                    <div className="bot">
                      <Mark size={26} />
                      <div className="col">
                        {text ? <div className="bub"><Md text={text} /></div> : t.done && !actions.length ? <div className="bub muted"><p>No reply.</p></div> : null}
                        {actions.map((a, j) => <Card key={j} a={a} readOnly={!!view} go={(p) => { if (p !== path) router.push(p); }} />)}
                        {t.done ? (
                          <div className="meta">
                            <span title="When TruePe AI replied">{time(t.ts + (t.ms ?? 0))}</span>
                            <span title="From Claude Code's own result for this reply">{usd(t.cost)}</span>
                            <span title={t.checks.map((c) => `${c.decision} · ${c.tool} · ${short(c.policy) || "all policies passed"} · ${c.ms} ms`).join("\n")}>
                              <ShieldCheckIcon size={13} /> {t.checks.length} checked{blocked.length ? ` · ${blocked.length} blocked` : ""}
                            </span>
                            {text ? <Copy text={text} /> : null}
                            {isLast && !busy && !view ? <button className="meta-btn" onClick={() => send(t.text)} title="Send this message again"><ArrowClockwiseIcon size={13} />Retry</button> : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {view ? null : pending?.text ? (
              <div className="turn">
                <p className={`me ${pending.error ? "failed" : "sending"}`}>{pending.text}</p>
                {pending.error ? (
                  <p className="sys err"><WarningCircleIcon size={13} /> Not sent: {pending.error}
                    <button className="meta-btn" onClick={() => send(pending.text)}>Retry</button>
                    <button className="meta-btn" onClick={() => { setMsg(pending.text); setPending(null); }}>Edit</button>
                  </p>
                ) : null}
              </div>
            ) : pending?.error ? <p className="sys err"><WarningCircleIcon size={13} /> {pending.error}</p> : null}
            {doing ? <div className="bot typing"><Mark size={26} /><div className="bub"><span className="dots"><i /><i /><i /></span>{doing}</div></div> : null}
          </div>

          {!atBottom && chatting ? <button className="jump" onClick={() => setAtBottom(true)} aria-label="Jump to latest"><ArrowDownIcon size={16} /></button> : null}

          {view ? (
            <div className="past">
              <span>Past chat · read only</span>
              <button className="yes" onClick={back}>Back to current chat</button>
            </div>
          ) : (
          <form onSubmit={(e) => { e.preventDefault(); send(msg); }}>
            {menu ? (
              <ul className="cmds" id="tp-cmds" role="listbox" aria-label="Commands">
                {menu.length ? menu.map((c, i) => (
                  <li key={c.cmd} role="presentation">
                    {i === 0 || menu[i - 1].group !== c.group ? <span className="grp">{c.group}</span> : null}
                    <button type="button" id={`tp-cmd-${i}`} role="option" aria-selected={i === active} className={i === active ? "on" : ""}
                      onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => choose(c)}>
                      <code>/{c.cmd}</code><span>{c.hint}</span>
                    </button>
                  </li>
                )) : <li className="none">No command matches. Press Enter to send it as a message.</li>}
              </ul>
            ) : null}
            <button type="button" className="slash" onClick={slash} title="Commands (/)" aria-label="Show commands">/</button>
            <textarea ref={input} rows={1} value={msg} maxLength={MAX} placeholder={busy ? "TruePe AI is working…" : "Ask anything, or type /"} aria-label="Message TruePe AI"
              role="combobox" aria-expanded={!!menu?.length} aria-controls="tp-cmds" aria-autocomplete="list" aria-activedescendant={menu?.length ? `tp-cmd-${active}` : undefined}
              onChange={(e) => { setMsg(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (menu?.length) {
                  const n = menu.length;
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const next = (active + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
                    setActive(next);
                    document.getElementById(`tp-cmd-${next}`)?.scrollIntoView({ block: "nearest" });
                    return;
                  }
                  if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); choose(menu[active]); return; }
                }
                // Esc closes the menu first, the window only when there is no menu
                if (e.key === "Escape" && menu) { e.preventDefault(); e.stopPropagation(); setMsg(""); return; }
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(msg); }
              }} />
            {running && lastChat === last
              ? <button type="button" className="send stop" onClick={stop} aria-label="Stop" title="Stop"><StopIcon size={16} weight="fill" /></button>
              : <button type="submit" className="send" disabled={busy || !msg.trim()} aria-label="Send" title="Send (Enter)"><PaperPlaneRightIcon size={18} weight="fill" /></button>}
            <a className="brand" href="https://befailproof.ai" target="_blank" rel="noreferrer" aria-label="TruePe × Failproof AI"
              title="TruePe × Failproof AI. TruePe AI can make mistakes; Failproof AI checks every tool call it makes.">
              <Mark size={20} /><i>×</i><Image src={fpIcon} alt="" width={20} height={20} />
              {msg.length > MAX - 300 ? <em>{msg.length}/{MAX}</em> : null}
            </a>
          </form>
          )}
          </div>
        </section>
      ) : null}
      <button ref={launcher} className={`bubble ${open ? "on" : ""}`} onClick={() => toggle()} aria-expanded={open} aria-label={open ? "Close TruePe AI" : "Open TruePe AI (⌘K)"} title="TruePe AI (⌘K)">
        {open ? <XIcon size={22} /> : <Mark size={30} />}<span>TruePe AI</span>{unread ? <i className="dot" aria-label="New reply" /> : null}
      </button>
    </div>
  );
}
