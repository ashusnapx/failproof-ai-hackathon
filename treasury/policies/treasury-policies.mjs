// "Who said so?" — an AI agent may only move money a human authorized in words.
// Text that reached the agent through a tool (emails, invoices, APIs) never counts as authorization.
import { customPolicies, allow, deny } from "failproofai";
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

const PAY = /(?:^|[\s/])bin\/pay\b/;
const inr = (n) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });

function treasuryDir(ctx) {
  const dir = join(String(ctx.session?.cwd ?? ""), "treasury");
  return existsSync(join(dir, "vendors.json")) ? dir : null;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

// Every `bin/pay` invocation in a Bash command, including chained ones.
function payments(command) {
  return command
    .split(/&&|\|\||;|\n/)
    .filter((part) => PAY.test(part))
    .map((part) => {
      const flag = (name) => part.match(new RegExp(`--${name}\\s+(["']?)([^"'\\s]+)\\1`))?.[2] ?? "";
      return {
        to: flag("to"),
        amount: Number(flag("amount").replace(/[₹,]|rs\.?/gi, "")),
        memo: flag("memo"),
      };
    });
}

// What the human typed in this session: user turns that are not tool results.
function humanWords(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return [];
  const words = [];
  for (const line of readFileSync(transcriptPath, "utf8").split("\n")) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.type !== "user" || entry.isMeta) continue;
    const content = entry.message?.content;
    const texts =
      typeof content === "string"
        ? [content]
        : Array.isArray(content)
          ? content.filter((b) => b.type === "text").map((b) => b.text)
          : [];
    for (const t of texts) {
      const clean = t.replace(/<([a-z_-]+)[^>]*>[\s\S]*?<\/\1>/gi, "").trim();
      if (clean) words.push(clean);
    }
  }
  return words;
}

const BUDGET =
  /(?:budget|up ?to|max(?:imum)?|limit|cap)[^₹\d]{0,25}(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k)?/i;
const SCALE = { lakh: 1e5, lac: 1e5, crore: 1e7, cr: 1e7, k: 1e3 };

function humanBudget(words) {
  let found = null;
  for (const text of words) {
    for (const sentence of text.split(/\n+|(?<=[.!?])\s+/)) {
      const m = sentence.match(BUDGET);
      if (!m) continue;
      const amount = Number(m[1].replace(/,/g, "")) * (SCALE[m[2]?.toLowerCase()] ?? 1);
      if (amount > 0) found = { amount, quote: sentence.trim().slice(0, 160) };
    }
  }
  return found;
}

const paidTo = (dir, upi) => readJson(join(dir, "state", "ledger.json"), { payments: [] }).payments.filter((p) => p.to === upi).reduce((t, p) => t + p.amount, 0);

// Closest approved payee by edit distance on the part before @: names what a lookalike imitates.
function lookalike(vendors, upi) {
  const d = (a, b) => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  };
  const local = (u) => u.split("@")[0].toLowerCase();
  const best = vendors.map((v) => ({ v, dist: d(local(upi), local(v.upi)) })).sort((a, b) => a.dist - b.dist)[0];
  const shared = best && (local(upi).startsWith(local(best.v.upi).slice(0, 6)) || best.dist <= 4);
  return shared ? best.v : null;
}

// Which inbox message introduced this payee, if any.
function introducedBy(dir, upi) {
  const inbox = join(dir, "inbox");
  for (const file of readdirSync(inbox)) {
    const text = readFileSync(join(inbox, file), "utf8");
    if (!text.includes(upi)) continue;
    const from = text.match(/^From:\s*(.+)$/m)?.[1] ?? text.match(/"source":\s*"([^"]+)"/)?.[1];
    return `${from ?? file} (${file})`;
  }
  return null;
}

// hard: the kill switch denies even in observe mode.
function decide(dir, policy, pay, verdict, hard = false) {
  const mode = readJson(join(dir, "state", "mode.json"), { mode: "enforce" }).mode;
  const decision = verdict.ok ? "allow" : mode === "observe" && !hard ? "would-deny" : "deny";
  try {
    appendFileSync(
      join(dir, "state", "events.jsonl"),
      JSON.stringify({ ts: Date.now(), kind: "verdict", policy, decision, mode, ...pay, ...verdict }) + "\n",
    );
  } catch {
    // shortcut: the UI log is best-effort; the verdict below still applies.
  }
  if (decision === "deny" && policy !== "treasury-kill-switch") autoFreeze(dir);
  return decision === "deny" ? deny(`Blocked by Failproof AI (${policy}): ${verdict.reason}`) : null;
}

// Incident containment: 3 denied payouts in one run freeze every payout until a human unfreezes.
function autoFreeze(dir) {
  try {
    const lines = readFileSync(join(dir, "state", "events.jsonl"), "utf8").split("\n").filter(Boolean);
    const denies = new Set(lines.map((l) => JSON.parse(l)).filter((e) => e.kind === "verdict" && e.decision === "deny").map((e) => `${e.to}|${e.amount}`));
    if (denies.size >= 3) writeFileSync(join(dir, "state", "freeze.json"), JSON.stringify({ frozen: true, by: "auto: 3 denied payouts in one run", ts: Date.now() }));
  } catch {
    // shortcut: containment is best-effort; each deny above still applies.
  }
}

// Least privilege for the TruePe AP agent only: sessions whose human prompt is the AP instruction.
// Inbox mail is public input during a live demo, so the agent may read treasury/ and run the pay rail, nothing else.
const AP_PROMPT = /accounts-payable agent for Dosa Labs/;
customPolicies.add({
  name: "treasury-agent-sandbox",
  description: "The AP agent may only read treasury/ files and run the pay rail; an email cannot make it run, read or send anything else",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    const dir = treasuryDir(ctx);
    if (!dir || !humanWords(ctx.session?.transcriptPath).some((w) => AP_PROMPT.test(w))) return allow();
    const cwd = String(ctx.session?.cwd ?? "");
    const inside = (p) => {
      const abs = resolve(cwd, String(p ?? "."));
      return abs === dir || abs.startsWith(dir + sep);
    };
    const tool = ctx.toolName ?? "";
    const input = ctx.toolInput ?? {};
    let why = null;
    if (tool === "Bash") {
      const cmd = String(input.command ?? "").replace(/\s2>&1/g, "").trim();
      const safe = cmd.split(/&&|\n/).map((p) => p.trim()).filter(Boolean).every((p) =>
        /^(\.\/)?treasury\/bin\/pay\s[^;|&`$<>()]*$/.test(p) ||
        (/^(ls|cat|head)(\s[^;|&`$<>()]*)?$/.test(p) && p.split(/\s+/).slice(1).filter((a) => !a.startsWith("-")).every(inside)));
      if (!safe) why = `the AP agent may only run the pay rail or read treasury/ (tried: ${cmd.slice(0, 80)})`;
    } else if (["Read", "Glob", "Grep", "LS"].includes(tool)) {
      const p = input.file_path ?? input.path ?? input.pattern ?? ".";
      if (!inside(p)) why = `the AP agent may only read inside treasury/ (tried: ${String(p).slice(0, 80)})`;
    } else if (tool) {
      why = `${tool} is not allowed for the AP agent`;
    }
    if (!why) return allow();
    return decide(dir, "treasury-agent-sandbox", { to: "", amount: 0, memo: "" }, { ok: false, reason: why, provenance: { by: "untrusted", text: "sandbox" } }, true) ?? allow();
  },
});

customPolicies.add({
  name: "treasury-kill-switch",
  description: "A human can freeze every agent payout instantly; nothing moves while frozen",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const dir = treasuryDir(ctx);
    const pays = payments(String(ctx.toolInput?.command ?? ""));
    if (!dir || pays.length === 0) return allow();
    if (!readJson(join(dir, "state", "freeze.json"), { frozen: false }).frozen) return allow();
    const verdict = {
      ok: false,
      reason: "Payouts are frozen by a human (kill switch). Do not retry; tell the human what is pending.",
      provenance: { by: "human", text: "Kill switch pressed" },
    };
    return decide(dir, "treasury-kill-switch", pays[0], verdict, true) ?? allow();
  },
});

customPolicies.add({
  name: "treasury-no-duplicate-invoice",
  description: "An invoice is paid once: the same invoice number, or the same payee and amount, cannot be paid twice",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const dir = treasuryDir(ctx);
    const pays = payments(String(ctx.toolInput?.command ?? ""));
    if (!dir || pays.length === 0) return allow();
    const paid = readJson(join(dir, "state", "ledger.json"), { payments: [] }).payments;
    for (const pay of pays) {
      const dup = paid.find((p) => (pay.memo && p.memo === pay.memo) || (p.to === pay.to && p.amount === pay.amount));
      if (!dup) continue;
      const at = new Date(dup.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const verdict = {
        ok: false,
        reason: `${dup.memo || "This invoice"} was already paid (${inr(dup.amount)} to ${dup.to} at ${at}). Duplicate payouts are refused.`,
        provenance: { by: "ledger", text: `paid at ${at}` },
      };
      const blocked = decide(dir, "treasury-no-duplicate-invoice", pay, verdict);
      if (blocked) return blocked;
    }
    return allow();
  },
});

customPolicies.add({
  name: "treasury-payee-in-vendor-master",
  description: "UPI payouts only to payees in the vendor master; an email cannot add or change a payee",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const dir = treasuryDir(ctx);
    const pays = payments(String(ctx.toolInput?.command ?? ""));
    if (!dir || pays.length === 0) return allow();

    const vendors = readJson(join(dir, "vendors.json"), { vendors: [] }).vendors;
    for (const pay of pays) {
      const vendor = vendors.find((v) => v.upi === pay.to);
      const source = introducedBy(dir, pay.to);
      const twin = vendor ? null : lookalike(vendors, pay.to);
      const verdict = vendor
        ? { ok: true, reason: `${pay.to} is ${vendor.name} (GSTIN ${vendor.gstin}) in the vendor master`, provenance: { by: "vendor-master", text: vendor.name } }
        : {
            ok: false,
            reason: `${pay.to} is not in Dosa Labs' vendor master${twin ? ` (it looks like ${twin.upi}, ${twin.name})` : ""}. It came from ${source ?? "nowhere a human approved"}. Bank or UPI changes must be confirmed by phone with the vendor. Do not pay it, and do not retry with another ID: report it to the human.`,
            provenance: { by: "untrusted", text: source ?? "unknown" },
          };
      const blocked = decide(dir, "treasury-payee-in-vendor-master", pay, verdict);
      if (blocked) return blocked;
    }
    return allow();
  },
});

customPolicies.add({
  name: "treasury-vendor-spend-anomaly",
  description: "A payout far above what a vendor usually bills (vendors.json typical) needs a human, e.g. a Rs 100 delivery billed at Rs 10,000",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const dir = treasuryDir(ctx);
    const pays = payments(String(ctx.toolInput?.command ?? ""));
    if (!dir || pays.length === 0) return allow();
    const vendors = readJson(join(dir, "vendors.json"), { vendors: [] }).vendors;
    for (const pay of pays) {
      const v = vendors.find((x) => x.upi === pay.to);
      if (!v?.typical) continue;
      const before = paidTo(dir, pay.to);
      if (before + pay.amount <= v.typical * 1.5) continue;
      const split = pay.amount <= v.typical * 1.5;
      const verdict = {
        ok: false,
        reason: split
          ? `Split payment: ${inr(before)} already paid to ${v.name} this run, plus ${inr(pay.amount)} is ${((before + pay.amount) / v.typical).toFixed(1)}x its usual bill (${inr(v.typical)}). Get a human to approve.`
          : `${inr(pay.amount)} is ${(pay.amount / v.typical).toFixed(1)}x what ${v.name} usually bills (${inr(v.typical)}). Check units (paise vs rupees) and get a human to approve.`,
        provenance: { by: "vendor-master", text: `${v.name} typical ${inr(v.typical)}` },
      };
      const blocked = decide(dir, "treasury-vendor-spend-anomaly", pay, verdict);
      if (blocked) return blocked;
    }
    return allow();
  },
});

customPolicies.add({
  name: "treasury-velocity-limit",
  description: "At most 2 payouts per payee and 10 per run; a runaway agent cannot drain the wallet in small steps",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const dir = treasuryDir(ctx);
    const pays = payments(String(ctx.toolInput?.command ?? ""));
    if (!dir || pays.length === 0) return allow();
    const paid = readJson(join(dir, "state", "ledger.json"), { payments: [] }).payments;
    let total = paid.length;
    for (const pay of pays) {
      const toPayee = paid.filter((p) => p.to === pay.to).length;
      if (toPayee < 2 && total < 10) { total++; continue; }
      const verdict = {
        ok: false,
        reason: toPayee >= 2 ? `${pay.to} already received ${toPayee} payouts this run (limit 2).` : `${total} payouts this run (limit 10).`,
        provenance: { by: "ledger", text: "velocity limit" },
      };
      const blocked = decide(dir, "treasury-velocity-limit", pay, verdict);
      if (blocked) return blocked;
    }
    return allow();
  },
});

customPolicies.add({
  name: "treasury-proof-of-delivery",
  description: "Vendors marked requiresProof are paid only when treasury/proofs/<invoice>.json records a delivery with proof (3-way match)",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const dir = treasuryDir(ctx);
    const pays = payments(String(ctx.toolInput?.command ?? ""));
    if (!dir || pays.length === 0) return allow();
    const vendors = readJson(join(dir, "vendors.json"), { vendors: [] }).vendors;
    for (const pay of pays) {
      const v = vendors.find((x) => x.upi === pay.to);
      if (!v?.requiresProof) continue;
      const proof = readJson(join(dir, "proofs", `${pay.memo.replace(/[^\w-]+/g, "-")}.json`), null);
      if (proof?.delivered === true && proof?.pod) continue;
      const verdict = {
        ok: false,
        reason: `No proof of delivery for ${pay.memo || "this invoice"}. A "delivered" status without a POD (signature, photo or OTP) is not enough to pay ${v.name}.`,
        provenance: { by: "ledger", text: "no proof of delivery" },
      };
      const blocked = decide(dir, "treasury-proof-of-delivery", pay, verdict);
      if (blocked) return blocked;
    }
    return allow();
  },
});

customPolicies.add({
  name: "treasury-spend-within-human-budget",
  description: "Total spend must stay inside a budget the human typed; amounts read from tools never authorize spend",
  category: "Payments",
  defaultEnabled: true,
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const dir = treasuryDir(ctx);
    const pays = payments(String(ctx.toolInput?.command ?? ""));
    if (!dir || pays.length === 0) return allow();

    const budget = humanBudget(humanWords(ctx.session?.transcriptPath));
    let spent = readJson(join(dir, "state", "ledger.json"), { payments: [] }).payments.reduce((s, p) => s + p.amount, 0);
    for (const pay of pays) {
      let verdict;
      if (!budget) {
        verdict = { ok: false, reason: "No human in this session authorized any spending. Ask them for a budget.", provenance: { by: "untrusted", text: "no human words" } };
      } else if (!(pay.amount > 0) || spent + pay.amount > budget.amount) {
        verdict = {
          ok: false,
          reason: `${inr(pay.amount)} would take spend to ${inr(spent + pay.amount)}, over the ${inr(budget.amount)} the human approved ("${budget.quote}"). Check units (paise vs rupees) and ask the human before paying.`,
          provenance: { by: "human", text: budget.quote },
        };
      } else {
        verdict = { ok: true, reason: `${inr(spent + pay.amount)} of ${inr(budget.amount)} approved`, provenance: { by: "human", text: budget.quote } };
      }
      const blocked = decide(dir, "treasury-spend-within-human-budget", pay, verdict);
      if (blocked) return blocked;
      if (verdict.ok) spent += pay.amount;
    }
    return allow();
  },
});
