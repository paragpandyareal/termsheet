// S4. Payout from the funder to SUPPLIER_EMAIL, then poll until it settles.
// node --env-file=.env scripts/spikes/s4-payout.mjs
import { pp, record, need } from './lib.mjs';

need('SUPPLIER_EMAIL');
const id = `S4-${Date.now()}`;
const create = await pp('POST', '/v1/payments/payouts', {
  sender_batch_header: { sender_batch_id: `TS-PO-${id}`, email_subject: 'TermSheet payout for order SPIKE' },
  items: [{
    recipient_type: 'EMAIL',
    receiver: process.env.SUPPLIER_EMAIL,
    amount: { currency: 'USD', value: '19.40' },
    sender_item_id: `TS-POI-${id}`,
    note: 'Order SPIKE. $20.00 less 3% fee.',
  }],
});
const calls = [create];
const batchId = create.body?.batch_header?.payout_batch_id;
let batch = create.body?.batch_header?.batch_status, item;

if (batchId) {
  // Poll every 3 s for up to 3 minutes (PRD says 60 s; spike waits longer to learn the real time).
  const t0 = Date.now();
  while (Date.now() - t0 < 180000) {
    await new Promise((r) => setTimeout(r, 3000));
    const g = await pp('GET', `/v1/payments/payouts/${batchId}`);
    batch = g.body?.batch_header?.batch_status;
    item = g.body?.items?.[0]?.transaction_status;
    console.log(`  batch ${batch}, item ${item}`);
    if (['SUCCESS', 'DENIED', 'CANCELED'].includes(batch) && item !== 'PENDING') { calls.push(g); break; }
    if (Date.now() - t0 >= 177000) calls.push(g);
  }
}
const pass = batch === 'SUCCESS' && item === 'SUCCESS';
record('S4. Payout funder to supplier', pass, calls,
  `Batch ${batchId ?? 'none'} ended as ${batch ?? 'none'}, item ${item ?? 'none'}. Webhook not tested here (no public address yet), polling only.`);
process.exit(pass ? 0 : 1);
