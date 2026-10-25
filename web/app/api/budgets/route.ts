import { readBudgets, saveBudgets } from "@/lib/console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(readBudgets());
}

export async function PUT(req: Request) {
  const error = saveBudgets(await req.json().catch(() => null));
  return error ? Response.json({ error }, { status: 400 }) : Response.json(readBudgets());
}
