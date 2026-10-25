import { deleteVendor, listVendors, upsertVendor } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (err: string | null) => (err ? Response.json({ error: err }, { status: 400 }) : Response.json({ vendors: listVendors() }));
const body = (req: Request) => req.json().catch(() => ({}));

export async function GET() {
  return Response.json({ vendors: listVendors() });
}
export async function POST(req: Request) {
  return reply(upsertVendor({ ...(await body(req)), oldUpi: undefined }));
}
export async function PUT(req: Request) {
  return reply(upsertVendor(await body(req)));
}
export async function DELETE(req: Request) {
  return reply(deleteVendor(new URL(req.url).searchParams.get("upi")));
}
