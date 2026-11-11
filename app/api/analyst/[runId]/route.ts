// Server Sent Events stream of the analyst trace (PRD 4.2). Reads the stored trace, so a reload replays it.
import { one, sql } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(c) {
      let sent = 0;
      for (let i = 0; i < 400; i++) {
        const run = await one('SELECT trace_json, status, mode, model, output_json FROM analyst_run WHERE id=$1', [runId]);
        if (!run) break;
        const t = run.trace_json || [];
        for (; sent < t.length; sent++) c.enqueue(enc.encode(`data: ${JSON.stringify(t[sent])}\n\n`));
        if (run.status === 'DONE') {
          const evidence = await sql('SELECT evidence_id, source, summary FROM evidence WHERE run_id=$1 ORDER BY created_at', [runId]);
          c.enqueue(enc.encode(`event: final\ndata: ${JSON.stringify({ mode: run.mode, model: run.model, output: run.output_json, evidence })}\n\n`));
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      c.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}
