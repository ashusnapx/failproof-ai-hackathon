import { archiveChat } from "@/lib/chats";
import { cleanBudget, isRunning, run } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (isRunning()) return new Response("agent already running", { status: 409 });
  const q = new URL(req.url).searchParams;
  archiveChat(); // a run resets events.jsonl; keep any TruePe AI chat in it for the chats sidebar
  run(q.get("mode") === "observe" ? "observe" : "enforce", cleanBudget(q.get("budget")));
  return new Response("started", { status: 202 });
}
