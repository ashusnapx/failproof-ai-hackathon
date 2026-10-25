// What Failproof AI itself recorded for one Claude session: its hook decisions from the local Activity log (the
// files its dashboard's Activity tab reads), so screens show Failproof AI's data rather than a copy of our own.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = path.join(process.env.FAILPROOFAI_HOME ?? path.join(os.homedir(), ".failproofai"), "hook-activity");
export type Decision = { ts: number; tool: string | null; policy: string | null; decision: string; reason: string | null; ms: number };

let cache = { key: "", list: [] as Decision[] };

// Decisions for any of these Claude sessions (the /live run's and the chat's), oldest first.
export function sessionDecisions(ids: (string | null)[]): Decision[] {
  const want = ids.filter((x): x is string => !!x);
  if (!want.length || !existsSync(dir)) return [];
  // shortcut: the live file plus the 3 newest rolled pages cover any one chat; an older session's decisions fall off
  const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => {
    const p = path.join(dir, f);
    return { p, m: statSync(p).mtimeMs };
  }).sort((a, b) => b.m - a.m).slice(0, 4);
  const key = `${want.join("+")}:${files.map((f) => f.m).join(",")}`;
  if (key === cache.key) return cache.list;
  const list: Decision[] = [];
  for (const { p } of files) {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      if (!want.some((id) => line.includes(id))) continue;
      try {
        const e = JSON.parse(line);
        if (want.includes(e.sessionId) && e.eventType === "PreToolUse")
          list.push({ ts: e.timestamp, tool: e.toolName ?? null, policy: e.policyName ?? null, decision: e.decision, reason: e.reason ?? null, ms: e.durationMs ?? 0 });
      } catch { /* a line Failproof AI is still writing */ }
    }
  }
  list.sort((a, b) => a.ts - b.ts);
  cache = { key, list };
  return list;
}
