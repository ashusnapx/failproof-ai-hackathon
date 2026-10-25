import { deleteEmail, listInbox, upsertEmail } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (err: string | null) => (err ? Response.json({ error: err }, { status: 400 }) : Response.json({ inbox: listInbox() }));
const body = (req: Request) => req.json().catch(() => ({}));

export async function GET() {
  return Response.json({ inbox: listInbox() });
}
export async function POST(req: Request) {
  return reply(upsertEmail({ ...(await body(req)), id: undefined }));
}
export async function PUT(req: Request) {
  return reply(upsertEmail(await body(req)));
}
export async function DELETE(req: Request) {
  return reply(deleteEmail(new URL(req.url).searchParams.get("id")));
}
