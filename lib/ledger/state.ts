// Everything the money screens need, in one read.
import { sql, one } from '@/lib/db';
import { bootstrap, today } from './service';

let booted = false;
export async function getState() {
  if (!booted) { await bootstrap(); booted = true; }
  const [buyers, lines, receivables, instalments, attempts, payouts, moneyEvents, limitChanges] = await Promise.all([
    sql('SELECT * FROM buyer ORDER BY id'),
    sql('SELECT * FROM credit_line'),
    sql("SELECT r.*, r.due_date::text AS due, o.order_no FROM receivable r JOIN orders o ON o.id=r.order_id ORDER BY r.created_at DESC"),
    sql('SELECT *, due_date::text AS due FROM instalment ORDER BY due_date, seq'),
    sql('SELECT * FROM charge_attempt ORDER BY created_at DESC'),
    sql('SELECT p.*, o.order_no FROM payout p JOIN orders o ON o.id=p.order_id ORDER BY p.created_at DESC'),
    sql('SELECT * FROM money_event ORDER BY created_at DESC'),
    sql('SELECT * FROM limit_change ORDER BY created_at DESC'),
  ]);
  const totals = { supplier: 0, funder: 0, buyer: 0 } as Record<string, number>;
  const lastId: Record<string, string | null> = {};
  for (const m of [...moneyEvents].reverse()) { totals[m.party] += m.direction === 'in' ? m.amount_cents : -m.amount_cents; lastId[m.party] = m.paypal_id; }
  const webhooks = await sql('SELECT id, app, type, verified, created_at FROM webhook_event ORDER BY created_at DESC LIMIT 20');
  return { today: await today(), buyers, lines, receivables, instalments, attempts, payouts, moneyEvents, limitChanges, totals, lastId, webhooks };
}
export async function getBuyerView(buyerId: string) {
  const s = await getState();
  const messages = await sql('SELECT * FROM message WHERE buyer_id=$1 ORDER BY created_at', [buyerId]);
  const plans = await sql("SELECT r.* FROM restructure r JOIN receivable v ON v.id=r.receivable_id WHERE v.buyer_id=$1 ORDER BY r.created_at DESC", [buyerId]);
  return { ...s, buyer: s.buyers.find((b) => b.id === buyerId), line: s.lines.find((l) => l.buyer_id === buyerId), messages, plans };
}
export { one };
