import { listBills } from "@/lib/bills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ bills: listBills() });
}
