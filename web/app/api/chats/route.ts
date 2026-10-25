import { getChat, listChats } from "@/lib/chats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TruePe AI's past chats: the list for the sidebar, or one chat's events (?id=) to reopen read-only.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (id === null) return Response.json({ chats: listChats() });
  const events = getChat(id);
  return events ? Response.json({ events }) : Response.json({ error: "no such chat" }, { status: 404 });
}
