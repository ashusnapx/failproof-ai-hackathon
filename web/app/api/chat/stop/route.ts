import { stop } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TruePe AI's Stop button: ends the agent's current turn; payouts it already made stay in the ledger.
export async function POST() {
  return stop() ? new Response("stopped") : new Response("nothing running", { status: 409 });
}
