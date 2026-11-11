// Everything the money screens need, in one read.
import { sql, one } from '@/lib/db';
import { bootstrap, today } from './service';

let booted = false;
export async function getState() {
  if (!booted) { await bootstrap(); booted = true; }
  const [buyers, lines, receivables, instalments, attempts, payouts, moneyEvents, limitChanges] = await Promise.all([
    sql('SELECT id, key, display_name, business_type, stated_founded_year, has_sales_app, seeded FROM buyer ORDER BY id'),
    sql('SELECT id, buyer_id, status, limit_cents, ceiling_cents, term_days, deposit_pct, scorecard_version, (vault_id IS NOT NULL) AS saved, updated_at FROM credit_line'),
    sql("SELECT r.*, r.due_date::text AS due, o.order_no FROM receivable r JOIN orders o ON o.id=r.order_id ORDER BY r.created_at DESC"),
    sql('SELECT *, due_date::text AS due FROM instalment ORDER BY due_date, seq'),
    sql('SELECT * FROM charge_attempt ORDER BY created_at DESC'),
    sql('SELECT p.*, o.order_no FROM payout p JOIN orders o ON o.id=p.order_id ORDER BY p.created_at DESC'),
    sql('SELECT * FROM money_event ORDER BY created_at DESC'),
    sql('SELECT * FROM limit_change ORDER BY created_at DESC'),
  ]);
  const lastId: Record<string, string | null> = {};
  for (const m of [...moneyEvents].reverse()) lastId[m.party] = m.paypal_id;
  // The funder's position over every Net 30 order in the demo, including Second Shot's order funded 30 days earlier,
  // so every tile agrees: cash out (Payouts), cash in (charges), still owed by cafés, and the fee earned.
  const sent = payouts.filter((p: any) => p.batch_id && !['FAILED', 'DENIED'].includes(p.status));
  const paidOut = sent.reduce((a: number, p: any) => a + (p.amount_cents || 0), 0);
  const fees = sent.reduce((a: number, p: any) => a + (p.fee_cents || 0), 0);
  const collected = instalments.filter((i: any) => i.status === 'PAID').reduce((a: number, i: any) => a + i.amount_cents, 0);
  const owed = receivables.filter((r: any) => r.status !== 'PAID').reduce((a: number, r: any) => a + r.principal_cents - instalments.filter((i: any) => i.receivable_id === r.id && i.status === 'PAID').reduce((x: number, i: any) => x + i.amount_cents, 0), 0);
  const funder = { paidOut, collected, owed, fees, position: collected + owed - paidOut };
  const totals = { supplier: paidOut, funder: collected - paidOut, buyer: -collected } as Record<string, number>;
  if (sent[0]) lastId.supplier ||= sent[0].batch_id;
  const webhooks = await sql('SELECT id, app, type, verified, created_at FROM webhook_event ORDER BY created_at DESC LIMIT 20');
  return { today: await today(), buyers, lines, receivables, instalments, attempts, payouts, moneyEvents, limitChanges, totals, funder, lastId, webhooks };
}
export async function getBuyerView(buyerId: string) {
  const s = await getState();
  const messages = await sql('SELECT * FROM message WHERE buyer_id=$1 ORDER BY created_at', [buyerId]);
  const plans = await sql("SELECT r.* FROM restructure r JOIN receivable v ON v.id=r.receivable_id WHERE v.buyer_id=$1 ORDER BY r.created_at DESC", [buyerId]);
  return { ...s, buyer: s.buyers.find((b) => b.id === buyerId), line: s.lines.find((l) => l.buyer_id === buyerId), messages, plans };
}
export { one };
