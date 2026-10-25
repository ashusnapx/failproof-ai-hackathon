import { statSync } from "node:fs";
import { OPENING_BALANCE, ensureState, evalHistory, eventsPath, frozenBy, isRunning, listInbox, listPolicies, listVendors, readLedger, readSince, readVendors } from "@/lib/treasury";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  ensureState();
  const enc = new TextEncoder();
  let tick: ReturnType<typeof setInterval> | undefined;
  const stop = () => clearInterval(tick);
  req.signal.addEventListener("abort", stop);

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(enc.encode(`data: ${data}\n\n`));
        } catch {
          stop();
        }
      };
      send(JSON.stringify({ kind: "hello", vendors: readVendors(), opening: OPENING_BALANCE }));
      let offset = 0;
      let lastLedger = "";
      let lastData = "";
      tick = setInterval(() => {
        let size;
        try {
          size = statSync(eventsPath).size;
        } catch {
          return;
        }
        if (size < offset) {
          offset = 0;
          send(JSON.stringify({ kind: "reset" }));
        }
        try {
          const next = readSince(offset);
          offset = next.size;
          for (const line of next.lines) send(line);
          const ledger = JSON.stringify({ kind: "ledger", running: isRunning(), ...readLedger() });
          if (ledger !== lastLedger) send((lastLedger = ledger));
          // CRUD changes (from any tab or editor) reach every screen within one tick
          const by = frozenBy();
          const data = JSON.stringify({ kind: "data", vendors: listVendors(), inbox: listInbox(), frozen: !!by, frozenBy: by, history: evalHistory(), policies: listPolicies() });
          if (data !== lastData) send((lastData = data));
        } catch {
          // ledger mid-write by treasury/bin/pay; next tick retries
        }
      }, 300);
    },
    cancel: stop,
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" },
  });
}
