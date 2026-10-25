// Bills view: every inbox email/API invoice parsed into one row and pre-screened against the vendor master,
// so the human only sets a budget. The payout itself still goes through the agent + Failproof AI policies.

import { readFileSync } from "node:fs";
import path from "node:path";
import { readBudgets } from "./console";
import { listInbox, listVendors, root } from "./treasury";

export type Bill = {
  id: string; from: string; subject: string; invoice: string; amount: number | null; upi: string;
  vendor: string | null; status: "ready" | "review" | "suspicious"; note: string; gmail: boolean;
};

const num = (s: string) => Number(s.replace(/,/g, ""));
const inr = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
// same file and fields treasury-proof-of-delivery reads
const hasProof = (invoice: string) => {
  const f = path.join(root, "treasury", "proofs", `${invoice.replace(/[^\w-]+/g, "-")}.json`);
  try { const p = JSON.parse(readFileSync(f, "utf8")); return p.delivered === true && !!p.pod; } catch { return false; }
};

export function listBills(): Bill[] {
  const vendors = listVendors() as { name: string; upi: string; typical?: number; requiresProof?: boolean }[];
  const budgets = readBudgets();
  // Bills a run would pay, in inbox order: later bills meet the same ledger-based limits the policies apply.
  const paid: { upi: string; amount: number; invoice: string }[] = [];
  const spent = (upis: string[]) => paid.filter((p) => upis.includes(p.upi)).reduce((t, p) => t + p.amount, 0);
  return listInbox().map((m) => {
    const raw = m.body;
    let json: Record<string, unknown> | null = null;
    try { json = m.id.endsWith(".json") ? JSON.parse(raw) : null; } catch { json = null; }
    // the last UPI ID in the mail is the one it asks to be paid ("old ID ... will bounce, pay the new one")
    const upis = [...raw.matchAll(/\b[\w.-]{2,64}@[a-z]{2,20}\b(?![\w.-]*\.(?:in|com|co)\b)/gi)].map((x) => x[0]);
    const upi = (json?.pay_to_upi as string) ?? upis.at(-1) ?? "";
    const invoice = (json?.invoice_no as string) ?? raw.match(/(?:invoice(?: no)?|bill no|inv)[:\s#]*([A-Z0-9][\w/-]{2,30})/i)?.[1] ?? "";
    let amount: number | null = null;
    if (typeof json?.amount_paise === "number") amount = (json.amount_paise as number) / 100;
    else {
      const total = raw.match(/total(?: payable)?[^\d₹]{0,20}(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i) ?? raw.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i);
      if (total) amount = num(total[1]);
    }
    const vendor = vendors.find((v) => v.upi === upi) ?? null;
    const dup = paid.find((p) => (invoice && p.invoice === invoice) || (p.upi === upi && p.amount === amount));
    const before = spent([upi]);
    const cap = budgets.vendors[upi] ?? {};
    const group = budgets.groups.find((g) => g.id === cap.group);
    const over = [
      typeof cap.cap === "number" ? { label: "vendor cap", cap: cap.cap, used: before } : null,
      typeof group?.cap === "number" ? { label: `${group.name} budget`, cap: group.cap, used: spent(Object.keys(budgets.vendors).filter((u) => budgets.vendors[u].group === group.id)) } : null,
    ].find((c) => c && amount != null && c.used + amount > c.cap);
    let status: Bill["status"] = "ready", note = "Approved payee";
    if (!upi) { status = "review"; note = "No UPI ID found"; }
    else if (!vendor) { status = "suspicious"; note = "Payee not in vendor master: TruePe will block it"; }
    else if (dup) { status = "review"; note = `Duplicate of ${dup.invoice}: TruePe pays an invoice once`; }
    else if (amount == null) { status = "review"; note = "No amount found"; }
    else if (vendor.typical && before + amount > vendor.typical * 1.5) {
      status = "review";
      note = amount <= vendor.typical * 1.5 ? `Split payment: ${((before + amount) / vendor.typical).toFixed(1)}x usual bill with earlier ones` : `${(amount / vendor.typical).toFixed(1)}x usual bill`;
    }
    else if (paid.filter((p) => p.upi === upi).length >= 2) { status = "review"; note = "3rd payout to this payee (limit 2)"; }
    else if (vendor.requiresProof && !hasProof(invoice)) { status = "review"; note = "No proof of delivery: TruePe will block it"; }
    else if (over) { status = "review"; note = `Over ${over.label} of ${inr(over.cap)}`; }
    else if (vendor.requiresProof) note = "Approved payee · proof of delivery on file";
    if (status === "ready") paid.push({ upi, amount: amount!, invoice });
    return { id: m.id, from: m.from, subject: m.subject, invoice, amount, upi, vendor: vendor?.name ?? null, status, note, gmail: m.id.startsWith("gm-") };
  });
}
