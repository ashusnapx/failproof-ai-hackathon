// TruePe AI chat history. New chat and a /live run both reset events.jsonl, so before they do, a chat that has
// human messages is copied to state/chats/<first message ts>.jsonl together with Failproof AI's own decisions for
// its session (a final {"kind":"fp"} line), so the sidebar can reopen it read-only with real numbers.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sessionDecisions } from "./failproof";
import { eventsPath, root, session } from "./treasury";

const dir = path.join(root, "treasury", "state", "chats");
const ID = /^\d{10,16}$/;
type Ev = { kind: string; ts?: number; text?: string; chat?: boolean; cost?: number };

const read = (file: string): Ev[] => readFileSync(file, "utf8").split("\n").filter(Boolean).flatMap((l) => {
  try { return [JSON.parse(l)]; } catch { return []; }
});

export function archiveChat() {
  if (!existsSync(eventsPath)) return;
  const events = read(eventsPath);
  const first = events.find((e) => e.kind === "human" && e.chat);
  if (!first) return;
  mkdirSync(dir, { recursive: true });
  const fp = { kind: "fp", list: sessionDecisions([session("chat")]) };
  writeFileSync(path.join(dir, `${first.ts}.jsonl`), [...events, fp].map((e) => JSON.stringify(e)).join("\n") + "\n");
}

export function listChats() {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).map((f) => f.replace(/\.jsonl$/, "")).filter((id) => ID.test(id)).map((id) => {
    const events = read(path.join(dir, `${id}.jsonl`));
    const said = events.filter((e) => e.kind === "human" && e.chat);
    // Claude Code's own cost for each chat reply; a /live run inside the same log is not the chat's
    let cost = 0, inChat = false;
    for (const e of events) {
      if (e.kind === "human") inChat = !!e.chat;
      if (e.kind === "done" && inChat) cost += e.cost ?? 0;
    }
    return { id, title: said[0]?.text?.slice(0, 80) ?? "", ts: said[0]?.ts ?? Number(id), messages: said.length, cost };
  }).sort((a, b) => b.ts - a.ts);
}

export function getChat(id: string | null) {
  return id && ID.test(id) && existsSync(path.join(dir, `${id}.jsonl`)) ? read(path.join(dir, `${id}.jsonl`)) : null;
}
