// Flow A step 5. Setup token on the funder app (spike S1). Returns the PayPal approval link.
import { sql, one } from '@/lib/db';
import { createSetupToken } from '@/lib/paypal/money';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const app = await one("SELECT * FROM application WHERE order_id=$1 AND status IN ('APPROVED','COUNTEROFFER') ORDER BY created_at DESC LIMIT 1", [orderId]);
  if (!app) return Response.json({ error: 'Not approved' }, { status: 400 });
  const base = process.env.APP_BASE_URL || new URL(req.url).origin;
  const r = await createSetupToken(`${base}/apply/return?order=${orderId}`, `${base}/apply/${orderId}?cancelled=1`);
  if (!r.id) return Response.json({ error: 'PayPal error', debugId: r.debugId }, { status: 502 });
  await sql('UPDATE application SET setup_token_id=$2 WHERE id=$1', [app.id, r.id]);
  return Response.json({ approveUrl: r.approveUrl, setupTokenId: r.id, debugId: r.debugId });
}
