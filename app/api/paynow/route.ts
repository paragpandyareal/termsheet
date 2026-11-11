// Normal pay now through the supplier's own PayPal app (PRD 6.2). create and capture.
import { pp } from '@/lib/paypal/client';
import { one } from '@/lib/db';
import { money } from '@/lib/ledger/service';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { action, orderId, paypalOrderId } = await req.json().catch(() => ({}));
  if (action === 'create') {
    const o = await one('SELECT * FROM orders WHERE id=$1', [orderId]);
    if (!o) return Response.json({ error: 'no order' }, { status: 404 });
    const r = await pp('supplier', 'POST', '/v2/checkout/orders', { intent: 'CAPTURE', purchase_units: [{ reference_id: o.id, description: `Ridgeline wholesale order ${o.order_no}`, amount: { currency_code: 'USD', value: (o.amount_cents / 100).toFixed(2) } }] });
    return Response.json({ id: r.body?.id, debugId: r.debugId });
  }
  if (action === 'capture') {
    const r = await pp('supplier', 'POST', `/v2/checkout/orders/${paypalOrderId}/capture`);
    const cap = r.body?.purchase_units?.[0]?.payments?.captures?.[0];
    if (cap?.status === 'COMPLETED') {
      const cents = Math.round(Number(cap.amount.value) * 100);
      await money('supplier', 'in', cents, 'Pay now order', cap.id, r.debugId);
      await money('buyer', 'out', cents, 'Paid now', cap.id, r.debugId);
    }
    return Response.json({ status: cap?.status || r.status, debugId: r.debugId });
  }
  return Response.json({ error: 'bad action' }, { status: 400 });
}
