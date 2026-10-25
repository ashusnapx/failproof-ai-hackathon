import { PACKS, addFromPack, listMachinePolicies } from "@/lib/console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// What Failproof AI enforces on this machine, plus the catalog the console offers.
export async function GET() {
  return Response.json({ packs: PACKS, ...(await listMachinePolicies()) });
}

// Add-only: turn on a pack, or some of its policies. Turning one off is left to a human at a terminal.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { pack?: string; policies?: string[] };
  const result = await addFromPack(String(body.pack ?? ""), Array.isArray(body.policies) ? body.policies.map(String) : []);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
