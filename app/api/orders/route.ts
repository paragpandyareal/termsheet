import { sql, newId } from '@/lib/db';
import { bootstrap } from '@/lib/ledger/service';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  await bootstrap();
  const { buyerKey = 'larkspur', amountCents = 200000, items = [] } = await req.json().catch(() => ({}));
  const buyer = (await sql('SELECT * FROM buyer WHERE key=$1', [buyerKey]))[0];
  if (!buyer) return Response.json({ error: 'unknown buyer' }, { status: 400 });
  const id = newId('ord');
  const orderNo = `RR-${Date.now().toString().slice(-6)}`;
  const shipTo = buyerKey === 'northgate' ? 'Pier 40 Freight Forwarding, Bayonne NJ' : `${buyer.display_name}, Main St`;
  await sql("INSERT INTO orders (id, buyer_id, order_no, amount_cents, ship_to, items_json, status) VALUES ($1,$2,$3,$4,$5,$6,'CART')",
    [id, buyer.id, orderNo, amountCents, shipTo, JSON.stringify(items)]);
  return Response.json({ id, orderNo });
}
