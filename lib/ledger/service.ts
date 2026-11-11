// Ledger service (PRD 7, 3.1 to 3.3). Every money step is a real PayPal sandbox call. The AI never moves money.
import fs from 'node:fs';
import path from 'node:path';
import { sql, one, newId } from '@/lib/db';
import { chargeVault, sendPayout, getPayout } from '@/lib/paypal/money';
import { addDays, appDate, limitAfterFailure, limitAfterOnTime, payoutFor } from './rules';

// One money and date format for messages: $2,000 and 12 Nov 2026.
const m$ = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });
const d$ = (d: any) => new Date((typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)) + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const BUYERS = [
  { key: 'larkspur', name: 'Larkspur Café', type: 'Café', founded: 2019, emailVar: 'BUYER_LARKSPUR_EMAIL', salesApp: true },
  { key: 'secondshot', name: 'Second Shot Café', type: 'Café', founded: 2021, emailVar: 'BUYER_SECONDSHOT_EMAIL', salesApp: true },
  { key: 'northgate', name: 'Northgate Resale LLC', type: 'Café', founded: 2019, emailVar: 'BUYER_NORTHGATE_EMAIL', salesApp: false },
];

// Saved account IDs made by the seed script. Hosting passes them as env vars instead.
function seedVault(key: string): string | undefined {
  const env = process.env[`SEED_VAULT_${key.toUpperCase().replace(':', '_')}`];
  if (env) return env;
  try {
    const s = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/seed/.seed-state.json'), 'utf8'));
    return s.vaults?.[key]?.id;
  } catch { return undefined; }
}

export async function bootstrap() {
  for (const b of BUYERS) {
    const id = `buyer_${b.key}`;
    await sql(`INSERT INTO buyer (id, key, display_name, business_type, stated_founded_year, paypal_email, has_sales_app, seeded)
      VALUES ($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT (key) DO UPDATE SET paypal_email=COALESCE(EXCLUDED.paypal_email, buyer.paypal_email), has_sales_app=EXCLUDED.has_sales_app`, [id, b.key, b.name, b.type, b.founded, b.emailVar ? process.env[b.emailVar] || (b.key === 'northgate' ? 'northgateresale@example.com' : null) : null, b.salesApp]);
    await sql(`INSERT INTO credit_line (id, buyer_id) VALUES ($1,$2) ON CONFLICT (buyer_id) DO NOTHING`, [`line_${b.key}`, id]);
  }
}

export async function today() {
  const c = await one('SELECT offset_days FROM clock WHERE id=1');
  return appDate(c?.offset_days || 0);
}

export async function money(party: 'supplier' | 'funder' | 'buyer', direction: 'in' | 'out', cents: number, label: string, paypalId?: string | null, debugId?: string | null) {
  await sql('INSERT INTO money_event (id, party, direction, amount_cents, label, paypal_id, debug_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [newId('mv'), party, direction, cents, label, paypalId || null, debugId || null]);
}

export async function postMessage(buyerId: string, sender: 'BUYER' | 'FUNDER' | 'SYSTEM', body: string, receivableId?: string) {
  const id = newId('msg');
  await sql('INSERT INTO message (id, buyer_id, receivable_id, sender, body) VALUES ($1,$2,$3,$4,$5)', [id, buyerId, receivableId || null, sender, body]);
  return id;
}

async function setLimit(buyerId: string, toCents: number, reason: string) {
  const line = await one('SELECT * FROM credit_line WHERE buyer_id=$1', [buyerId]);
  if (!line || line.limit_cents === toCents) return;
  await sql('UPDATE credit_line SET limit_cents=$2, updated_at=now() WHERE id=$1', [line.id, toCents]);
  await sql('INSERT INTO limit_change (id, credit_line_id, from_cents, to_cents, reason_code) VALUES ($1,$2,$3,$4,$5)', [newId('lc'), line.id, line.limit_cents, toCents, reason]);
}

// Flow A steps 7 to 9. Payout guard (PRD 7.1): approved application, vault stored, one payout per order.
export async function fundOrder(orderId: string) {
  const order = await one('SELECT * FROM orders WHERE id=$1', [orderId]);
  const app = await one("SELECT * FROM application WHERE order_id=$1 AND status IN ('APPROVED','COUNTEROFFER') ORDER BY created_at DESC LIMIT 1", [orderId]);
  const line = await one('SELECT * FROM credit_line WHERE buyer_id=$1', [order?.buyer_id]);
  if (!order || !app || !line?.vault_id) throw new Error('Payout guard: needs an approved application and a saved PayPal account.');
  if (await one('SELECT id FROM payout WHERE order_id=$1', [orderId])) return; // already funded

  const due = addDays(await today(), line.term_days || 30);
  const rcvId = newId('rcv');
  await sql('INSERT INTO receivable (id, order_id, buyer_id, principal_cents, due_date) VALUES ($1,$2,$3,$4,$5)', [rcvId, orderId, order.buyer_id, order.amount_cents, due]);
  await sql('INSERT INTO instalment (id, receivable_id, seq, amount_cents, due_date) VALUES ($1,$2,1,$3,$4)', [newId('ins'), rcvId, order.amount_cents, due]);
  await sql("UPDATE orders SET status='FUNDED', updated_at=now() WHERE id=$1", [orderId]);

  const { payoutCents, feeCents } = payoutFor(order.amount_cents);
  const p = await sendPayout({
    email: process.env.SUPPLIER_EMAIL || '', cents: payoutCents, batchRef: `TS-PO-${orderId}-${Date.now()}`, itemRef: `TS-POI-${orderId}`,
    subject: `TermSheet payout for order ${order.order_no}`, note: `Order ${order.order_no}. $${(order.amount_cents / 100).toFixed(2)} less 3% fee.`,
  });
  await sql('INSERT INTO payout (id, order_id, batch_id, amount_cents, fee_cents, status, debug_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [newId('po'), orderId, p.batchId || null, payoutCents, feeCents, p.ok ? p.batchStatus || 'PENDING' : 'FAILED', p.debugId]);
  if (p.ok) await money('supplier', 'in', payoutCents, `Payout for ${order.order_no}`, p.batchId, p.debugId);
  return { receivableId: rcvId, due, payout: p };
}

export async function refreshPayouts() {
  for (const p of await sql("SELECT * FROM payout WHERE status NOT IN ('SUCCESS','FAILED','DENIED') AND batch_id IS NOT NULL")) {
    const g = await getPayout(p.batch_id);
    if (g.ok && g.batchStatus) await sql('UPDATE payout SET status=$2, item_id=$3, updated_at=now() WHERE id=$1', [p.id, g.itemStatus === 'SUCCESS' ? 'SUCCESS' : g.batchStatus, g.itemId || null]);
  }
}

// Charge one instalment with the buyer absent (Flow B, C).
export async function chargeInstalment(insId: string) {
  const ins = await one('SELECT * FROM instalment WHERE id=$1', [insId]);
  if (!ins || ins.status === 'PAID') return null;
  const rcv = await one('SELECT * FROM receivable WHERE id=$1', [ins.receivable_id]);
  const order = await one('SELECT * FROM orders WHERE id=$1', [rcv.order_id]);
  const line = await one('SELECT * FROM credit_line WHERE buyer_id=$1', [rcv.buyer_id]);
  const attemptNo = Number((await one('SELECT count(*)::int AS n FROM charge_attempt WHERE instalment_id=$1', [insId]))?.n || 0) + 1;
  const mock = !!rcv.force_decline_once;

  const r = await chargeVault({
    vaultId: line.vault_id, cents: ins.amount_cents, referenceId: rcv.id, invoiceId: `TS-${ins.id}-${attemptNo}-${Date.now()}`,
    description: `Net 30 repayment, Ridgeline order ${order.order_no}${ins.seq > 1 || rcv.status === 'RESTRUCTURED' ? `, instalment ${ins.seq}` : ''}`,
    mockDecline: mock, requestId: `chg-${ins.id}-${attemptNo}`,
  });
  await sql('INSERT INTO charge_attempt (id, instalment_id, mode, paypal_order_id, capture_id, status, error_name, debug_id, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [newId('ca'), insId, mock ? 'MOCK_DECLINE_C' : 'REAL', r.orderId || null, r.captureId || null, r.completed ? 'COMPLETED' : 'FAILED', r.issue, r.debugId, JSON.stringify(r.body)]);
  if (mock) await sql('UPDATE receivable SET force_decline_once=false WHERE id=$1', [rcv.id]);

  if (r.completed) {
    await sql("UPDATE instalment SET status='PAID', updated_at=now() WHERE id=$1", [insId]);
    await money('funder', 'in', ins.amount_cents, `Repayment ${order.order_no}`, r.captureId, r.debugId);
    await money('buyer', 'out', ins.amount_cents, `Charged for ${order.order_no}`, r.captureId, r.debugId);
    const left = await one("SELECT count(*)::int AS n FROM instalment WHERE receivable_id=$1 AND status='SCHEDULED'", [rcv.id]);
    if (!left?.n) {
      const wasClean = rcv.status === 'OPEN';
      await sql("UPDATE receivable SET status='PAID', updated_at=now() WHERE id=$1", [rcv.id]);
      if (wasClean) await setLimit(rcv.buyer_id, limitAfterOnTime(line.limit_cents, line.ceiling_cents), 'ON_TIME');
      const pastDue = await one("SELECT id FROM receivable WHERE buyer_id=$1 AND status='PAST_DUE'", [rcv.buyer_id]);
      if (!pastDue) await sql("UPDATE credit_line SET status='ACTIVE', updated_at=now() WHERE id=$1", [line.id]);
      await postMessage(rcv.buyer_id, 'SYSTEM', `Thanks. ${order.order_no} is paid in full.`, rcv.id);
    }
  } else {
    await sql("UPDATE instalment SET status='FAILED', updated_at=now() WHERE id=$1", [insId]);
    await sql("UPDATE receivable SET status='PAST_DUE', updated_at=now() WHERE id=$1", [rcv.id]);
    await sql("UPDATE credit_line SET status='FROZEN', updated_at=now() WHERE id=$1", [line.id]);
    await setLimit(rcv.buyer_id, limitAfterFailure(line.limit_cents), 'RP08');
    await postMessage(rcv.buyer_id, 'FUNDER', `Your ${m$(ins.amount_cents)} payment for order ${order.order_no} did not go through. Reply here and we will work it out.`, rcv.id);
  }
  return r;
}

// Clock (PRD 7.1). Only the app date moves. Every charge is a real PayPal sandbox call.
export async function advanceClock(days: number) {
  await sql('UPDATE clock SET offset_days = offset_days + $1 WHERE id=1', [days]);
  return runCollections();
}
export async function jumpToNextDue() {
  const t = await today();
  const next = await one("SELECT due_date::text AS d FROM instalment WHERE status='SCHEDULED' ORDER BY due_date LIMIT 1");
  if (!next) return { charged: 0 };
  const diff = Math.max(0, Math.round((Date.parse(next.d) - Date.parse(t)) / 864e5));
  return advanceClock(diff);
}
export async function runCollections() {
  const t = await today();
  for (const i of await sql("SELECT i.* FROM instalment i JOIN receivable r ON r.id=i.receivable_id WHERE i.status='SCHEDULED' AND NOT i.reminded AND i.due_date <= ($1::date + 3)", [t])) {
    await sql('UPDATE instalment SET reminded=true WHERE id=$1', [i.id]);
    const r = await one('SELECT buyer_id FROM receivable WHERE id=$1', [i.receivable_id]);
    await postMessage(r.buyer_id, 'SYSTEM', `Reminder. ${m$(i.amount_cents)} will be charged to your saved PayPal account on ${d$(i.due_date)}.`, i.receivable_id);
  }
  const due = await sql("SELECT id FROM instalment WHERE status='SCHEDULED' AND due_date <= $1::date ORDER BY due_date, seq", [t]);
  let charged = 0;
  for (const i of due) { await chargeInstalment(i.id); charged++; }
  return { charged, today: t };
}

// Flow C step 7. Accepting a plan replaces the failed instalment. First instalment is charged at once.
export async function acceptPlan(restructureId: string) {
  const rs = await one('SELECT * FROM restructure WHERE id=$1', [restructureId]);
  if (!rs || rs.status !== 'PROPOSED') throw new Error('No open plan.');
  const rcv = await one('SELECT * FROM receivable WHERE id=$1', [rs.receivable_id]);
  const orig = typeof rcv.due_date === 'string' ? rcv.due_date : rcv.due_date.toISOString().slice(0, 10);
  // Keep FAILED instalments as history (their charge attempts show the decline). Replace only what is still scheduled.
  await sql("DELETE FROM instalment WHERE receivable_id=$1 AND status='SCHEDULED'", [rcv.id]);
  const ids: string[] = [];
  const plan = rs.proposal_json.instalments as { amount_cents: number; due_in_days_from_original: number }[];
  const t = await today();
  for (let k = 0; k < plan.length; k++) {
    const id = newId('ins'); ids.push(id);
    const dueDate = k === 0 ? t : addDays(orig, plan[k].due_in_days_from_original);
    await sql('INSERT INTO instalment (id, receivable_id, seq, amount_cents, due_date, reminded) VALUES ($1,$2,$3,$4,$5,$6)', [id, rcv.id, k + 1, plan[k].amount_cents, dueDate, k === 0]);
  }
  await sql("UPDATE restructure SET status='ACCEPTED', updated_at=now() WHERE id=$1", [rs.id]);
  await sql("UPDATE receivable SET status='RESTRUCTURED', updated_at=now() WHERE id=$1", [rcv.id]);
  await postMessage(rcv.buyer_id, 'BUYER', 'Accepted the payment plan.', rcv.id);
  const first = await chargeInstalment(ids[0]);
  if (first?.completed) {
    // Freeze lifts once nothing is past due and the plan is up to date (PRD 7.1).
    const pastDue = await one("SELECT id FROM receivable WHERE buyer_id=$1 AND status='PAST_DUE'", [rcv.buyer_id]);
    if (!pastDue) await sql("UPDATE credit_line SET status='ACTIVE', updated_at=now() WHERE buyer_id=$1", [rcv.buyer_id]);
  }
  return first;
}

// Second Shot's open order, ready for Flow C (PRD 11.2). Needs the funder saved account from seeding.
export async function armSecondShot() {
  const buyerId = 'buyer_secondshot';
  const vault = seedVault('funder:secondshot');
  if (!vault) return { ok: false, reason: 'No saved Second Shot account on the funder app. Run the seed approval for funder secondshot.' };
  await sql("UPDATE credit_line SET status='ACTIVE', limit_cents=500000, ceiling_cents=500000, term_days=30, vault_id=$2, scorecard_version='sc-1', updated_at=now() WHERE buyer_id=$1", [buyerId, vault]);
  const orderNo = `RR-${Date.now().toString().slice(-6)}`;
  const orderId = newId('ord');
  await sql("INSERT INTO orders (id, buyer_id, order_no, amount_cents, ship_to, items_json, status) VALUES ($1,$2,$3,200000,'Second Shot Café, 88 Harbor Ave','[]','APPLIED')", [orderId, buyerId, orderNo]);
  await sql("INSERT INTO application (id, order_id, buyer_id, status, decision_json) VALUES ($1,$2,$3,'APPROVED',$4)", [newId('app'), orderId, buyerId, JSON.stringify({ outcome: 'APPROVE', limit_cents: 500000, term_days: 30, seeded: true })]);
  const f = await fundOrder(orderId);
  // Due on the next clock step: one app day away.
  const t = await today();
  await sql('UPDATE receivable SET due_date=$2, force_decline_once=true WHERE id=$1', [f!.receivableId, addDays(t, 1)]);
  await sql('UPDATE instalment SET due_date=$2 WHERE receivable_id=$1', [f!.receivableId, addDays(t, 1)]);
  return { ok: true, orderNo };
}

// PRD 11.3. App state only. PayPal history is never deleted.
export async function resetDemo() {
  for (const t of ['charge_attempt', 'instalment', 'receivable', 'restructure', 'limit_change', 'payout', 'application', 'evidence', 'analyst_run', 'orders', 'message', 'money_event', 'document'])
    await sql(`DELETE FROM ${t}`);
  await sql("UPDATE credit_line SET status='NONE', limit_cents=0, ceiling_cents=0, vault_id=NULL, updated_at=now()");
  await sql('UPDATE clock SET offset_days=0 WHERE id=1');
  await bootstrap();
  return armSecondShot();
}
