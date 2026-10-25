import { readRules, saveRules } from "@/lib/console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(readRules());
}

export async function PUT(req: Request) {
  const error = saveRules(await req.json().catch(() => null));
  return error ? Response.json({ error }, { status: 400 }) : Response.json(readRules());
}
