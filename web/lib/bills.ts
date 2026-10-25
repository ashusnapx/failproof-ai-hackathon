// Bills view: every inbox email/API invoice parsed into one row and pre-screened against the vendor master,
// so the human only sets a budget. The payout itself still goes through the agent + Failproof AI policies.

import { listInbox, listVendors } from "./treasury";

export type Bill = {
  id: string; from: string; subject: string; invoice: string; amount: number | null; upi: string;
  vendor: string | null; status: "ready" | "review" | "suspicious"; note: string; gmail: boolean;
};

const num = (s: string) => Number(s.replace(/,/g, ""));

export function listBills(): Bill[] {
  const vendors = listVendors() as { name: string; upi: string; typical?: number; requiresProof?: boolean }[];
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
    let status: Bill["status"] = "ready", note = "Approved payee";
    if (!upi) { status = "review"; note = "No UPI ID found"; }
    else if (!vendor) { status = "suspicious"; note = "Payee not in vendor master: TruePe will block it"; }
    else if (amount && vendor.typical && amount > vendor.typical * 1.5) { status = "review"; note = `${(amount / vendor.typical).toFixed(1)}x usual bill`; }
    else if (vendor.requiresProof) note = "Approved payee · proof of delivery required";
    return { id: m.id, from: m.from, subject: m.subject, invoice, amount, upi, vendor: vendor?.name ?? null, status, note, gmail: m.id.startsWith("gm-") };
  });
}
