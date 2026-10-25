import { isRunning, run } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (isRunning()) return new Response("agent already running", { status: 409 });
  run(new URL(req.url).searchParams.get("mode") === "observe" ? "observe" : "enforce");
  return new Response("started", { status: 202 });
}
