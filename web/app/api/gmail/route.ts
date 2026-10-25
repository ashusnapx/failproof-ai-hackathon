import { syncGmail } from "@/lib/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const r = await syncGmail();
    return Response.json(r, { status: "error" in r ? 400 : 200 });
  } catch (err) {
    return Response.json({ error: `Gmail sync failed: ${(err as Error).message}` }, { status: 502 });
  }
}
