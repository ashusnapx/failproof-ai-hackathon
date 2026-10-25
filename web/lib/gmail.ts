// Live Gmail -> treasury/inbox: the newest payment-looking emails become gm-<uid>.txt, which the agent reads
// as untrusted tool output like any other inbox file. IMAP + a Gmail app password from web/.env.local.
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { root } from "./treasury";

const inbox = path.join(root, "treasury", "inbox");
const KEEP = 5; // shortcut: newest 5 matching emails from the last 6 h, enough for a live demo
const MATCH = /invoice|bill|payment|upi|pay|vendor|bank|refund/i;
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").slice(0, 160);

export async function syncGmail() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) return { error: "Set GMAIL_USER and GMAIL_APP_PASSWORD in web/.env.local" };
  const client = new ImapFlow({ host: "imap.gmail.com", port: 993, secure: true, auth: { user, pass }, logger: false });
  await client.connect();
  const found: { uid: number; from: string; subject: string; text: string }[] = [];
  const lock = await client.getMailboxLock("INBOX");
  try {
    const uids = (await client.search({ since: new Date(Date.now() - 6 * 3600_000) }, { uid: true })) || [];
    for (const uid of uids.slice(-40).reverse()) {
      if (found.length >= KEEP) break;
      const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
      if (!msg || !msg.source) continue;
      const mail = await simpleParser(msg.source);
      const subject = mail.subject ?? "";
      const text = (mail.text ?? "").slice(0, 3000);
      if (MATCH.test(`${subject} ${text}`)) found.push({ uid, from: mail.from?.text ?? "unknown", subject, text });
    }
  } finally {
    lock.release();
    await client.logout();
  }
  for (const f of readdirSync(inbox)) if (f.startsWith("gm-")) unlinkSync(path.join(inbox, f));
  for (const m of found)
    writeFileSync(path.join(inbox, `gm-${m.uid}.txt`), `From: ${oneLine(m.from)}\nTo: ${user}\nSubject: ${oneLine(m.subject)}\n\n${m.text}\n`);
  return { synced: found.length };
}
