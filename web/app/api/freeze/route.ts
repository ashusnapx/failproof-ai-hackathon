import { isFrozen, setFrozen } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ frozen: isFrozen() });
}
export async function POST(req: Request) {
  const { frozen } = (await req.json().catch(() => ({}))) as { frozen?: unknown };
  if (typeof frozen !== "boolean") return Response.json({ error: "frozen must be true or false" }, { status: 400 });
  setFrozen(frozen);
  return Response.json({ frozen });
}
