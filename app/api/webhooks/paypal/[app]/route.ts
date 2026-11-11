// PRD 6.9. Raw body first, verify with PayPal, store by event ID, ignore repeats, reject unverified.
import { sql, newId } from '@/lib/db';
import { verifyWebhook } from '@/lib/paypal/money';
import { onWebhook } from '@/lib/ledger/webhooks';

export const dynamic = 'force-dynamic';
const IDS: Record<string, string | undefined> = { funder: process.env.FUNDER_WEBHOOK_ID, supplier: process.env.SUPPLIER_WEBHOOK_ID };

export async function POST(req: Request, ctx: { params: Promise<{ app: string }> }) {
  const { app } = await ctx.params;
  const raw = await req.text();
  const webhookId = IDS[app];
  if (!webhookId) return new Response('unknown app', { status: 404 });
  const verified = await verifyWebhook(app as 'funder' | 'supplier', webhookId, req.headers, raw).catch(() => false);
  let ev: any = {};
  try { ev = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }
  if (!verified) return new Response('not verified', { status: 401 });
  const ins = await sql('INSERT INTO webhook_event (id, app, paypal_event_id, type, verified, raw_body) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (paypal_event_id) DO NOTHING RETURNING id',
    [newId('wh'), app, ev.id, ev.event_type, verified, raw]);
  if (ins.length) await onWebhook(app, ev).catch((e) => console.error('webhook handler', e));
  return new Response('ok');
}
