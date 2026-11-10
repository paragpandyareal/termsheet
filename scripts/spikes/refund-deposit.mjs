// Refunds the $1 S1 fallback deposit, labelled as a verification charge.
// node --env-file=.env scripts/spikes/refund-deposit.mjs
import { pp, record, loadState } from './lib.mjs';
const { s1fOrderId } = loadState();
const o = await pp('GET', `/v2/checkout/orders/${s1fOrderId}`);
const capId = o.body?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
const res = await pp('POST', `/v2/payments/captures/${capId}/refund`, { note_to_payer: 'Refund of the $1.00 account verification charge' });
const pass = res.status < 300 && res.body?.status === 'COMPLETED';
record('Refund of the $1 S1 fallback deposit (verification charge)', pass, [res], `Capture ${capId}, refund ${res.body?.id ?? 'none'} status ${res.body?.status ?? 'none'}.`);
