// Flow C steps 5 and 6. Buyer replies in free text, the analyst proposes a plan.
import { one } from '@/lib/db';
import { postMessage } from '@/lib/ledger/service';
import { startPlan } from '@/lib/analyst/run';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ buyerId: string }> }) {
  const { buyerId } = await ctx.params;
  const { body, retry } = await req.json().catch(() => ({ body: '' }));
  const text = String(body || '').trim().slice(0, 500);
  if (!text && !retry) return Response.json({ error: 'empty' }, { status: 400 });
  const rcv = await one("SELECT * FROM receivable WHERE buyer_id=$1 AND status='PAST_DUE' ORDER BY created_at DESC LIMIT 1", [buyerId]);
  if (!retry) await postMessage(buyerId, 'BUYER', text, rcv?.id);
  const open = rcv && (await one("SELECT id FROM restructure WHERE receivable_id=$1 AND status='PROPOSED'", [rcv.id]));
  const runId = rcv && !open ? await startPlan(rcv.id) : null;
  return Response.json({ ok: true, runId });
}
