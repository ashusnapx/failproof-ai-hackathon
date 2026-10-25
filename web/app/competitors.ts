// From the REA / WebFetch teardown of each product's own public page (25 Oct 2026); marketing claims, not audits.
export const COMPETITORS: { name: string; what: string; good: string; gap: string }[] = [
  { name: "Razorpay Agentic Payments", what: "Indian gateway, UPI Reserve Pay", good: "Consent-based, pre-authorized UPI payments within approved spending limits; MCP + APIs.", gap: "Vendor payouts too, and every payee traced to who introduced it: a fake “UPI changed” email can't." },
  { name: "Stripe Shared Payment Tokens", what: "Payment rail + agent toolkit", good: "Tokens with max amount, currency and expiry; revocable any time.", gap: "Checks who asked: the budget comes from the human's own words, not just a number on a token." },
  { name: "Crossmint", what: "Agent wallets and cards", good: "Spending caps, human approval above thresholds, merchant allowlists, audit logs.", gap: "Works at the agent's tool call across harnesses, on UPI, and treats inbox text as untrusted." },
  { name: "Visa Intelligent Commerce", what: "Card-network agent framework", good: "Consumer-set spending limits and conditions; tokenized credentials.", gap: "B2B and accounts-payable payouts, not just card checkout." },
  { name: "Payman", what: "Agent platform for banks", good: "Immutable policy engine, approvals, kill switch, full audit trail.", gap: "A developer drops it into any agent in minutes; no core-banking project." },
  { name: "Lakera Guard", what: "General AI runtime security", good: "Prompt-attack prevention; granular policies without code changes.", gap: "Knows money: payees, budgets, paise vs rupees, provenance per rupee." },
  { name: "Skyfire / Natural", what: "Agent identity and checkout", good: "Mandates binding merchant, product and amount; verifiable agent identity.", gap: "Proves the human approved this payee, not only who the agent is." },
];

export const WINS: { title: string; body: string }[] = [
  { title: "Every rupee traces to a human sentence", body: "Others use static caps or allowlists. TruePe reads the human's words; emails, invoices and APIs never authorize." },
  { title: "Inside the agent, before any rail", body: "Enforced at the tool call in Claude Code, Codex, Cursor, Copilot CLI and more, so it works in front of any payment rail." },
  { title: "UPI-native, built for Indian AP", body: "Vendor payouts, lakh formatting, Karnataka GSTINs, and paise-vs-rupees errors capped by the human budget." },
  { title: "Observe first, then enforce", body: "See what would be blocked on real runs before anything is denied. None of the pages we read offer this." },
];
