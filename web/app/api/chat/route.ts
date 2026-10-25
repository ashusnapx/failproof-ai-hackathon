import { writeFileSync } from "node:fs";
import path from "node:path";
import { listBills } from "@/lib/bills";
import { archiveChat } from "@/lib/chats";
import { syncGmail } from "@/lib/gmail";
import { chat, isRunning, newChat, root } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __gmailAt?: number };

// The human's message is their own words: the budget it names is what Failproof AI lets the agent spend.
export async function POST(req: Request) {
  if (isRunning()) return new Response("agent already running", { status: 409 });
  const body = (await req.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) return Response.json({ error: "message (max 2000 characters) is required" }, { status: 400 });
  // Gmail at most once a minute and never more than 4 s of the human's wait; a slower sync finishes in the background.
  if (process.env.GMAIL_USER && Date.now() - (g.__gmailAt ?? 0) > 60_000) {
    g.__gmailAt = Date.now();
    await Promise.race([syncGmail().catch(() => null), new Promise((r) => setTimeout(r, 4000))]);
  }
  if (isRunning()) return new Response("agent already running", { status: 409 });
  // The Bills screen's own pre-screen of every inbox bill, so the agent starts from all of them instead of the few it opens.
  writeFileSync(path.join(root, "treasury", "state", "bills.json"), JSON.stringify(listBills(), null, 2));
  chat(message);
  return new Response("started", { status: 202 });
}

export async function DELETE() {
  if (isRunning()) return new Response("agent already running", { status: 409 });
  archiveChat();
  newChat();
  return new Response(null, { status: 204 });
}
