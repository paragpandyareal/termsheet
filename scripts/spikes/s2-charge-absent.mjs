// S2. Charge the saved vault ID with the buyer absent. Business account as payer.
// node --env-file=.env scripts/spikes/s2-charge-absent.mjs
import { pp, record, loadState, saveState } from './lib.mjs';

const { vaultId } = loadState();
if (!vaultId) { console.error('No vault ID. Finish S1 first.'); process.exit(1); }

const id = `S2-${Date.now()}`;
const res = await pp('POST', '/v2/checkout/orders', {
  intent: 'CAPTURE',
  purchase_units: [{
    reference_id: id,
    invoice_id: `TS-${id}-1`,
    description: 'Net 30 repayment, Ridgeline order SPIKE',
    amount: { currency_code: 'USD', value: '20.00' },
  }],
  payment_source: { paypal: { vault_id: vaultId } },
});
const cap = res.body?.purchase_units?.[0]?.payments?.captures?.[0];
const pass = res.status < 300 && res.body?.status === 'COMPLETED' && cap?.status === 'COMPLETED';
if (pass) saveState({ s2OrderId: res.body.id, s2CaptureId: cap.id });
else console.log(JSON.stringify(res.body, null, 2));
record('S2. Charge vault ID, buyer absent, intent CAPTURE', pass, [res],
  `Order status ${res.body?.status ?? 'none'}, capture status ${cap?.status ?? 'none'}, order ${res.body?.id ?? 'none'}, capture ${cap?.id ?? 'none'}.`);
process.exit(pass ? 0 : 1);
