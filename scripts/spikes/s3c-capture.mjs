// S3, method C with intent CAPTURE, which is how the real day 30 charge runs.
// node --env-file=.env scripts/spikes/s3c-capture.mjs
import { pp, record, loadState } from './lib.mjs';
const { vaultId } = loadState();
if (!vaultId) { console.error('No vault ID.'); process.exit(1); }
const res = await pp('POST', '/v2/checkout/orders', {
  intent: 'CAPTURE',
  purchase_units: [{ reference_id: `S3CC-${Date.now()}`, invoice_id: `TS-S3CC-${Date.now()}`, amount: { currency_code: 'USD', value: '15.00' } }],
  payment_source: { paypal: { vault_id: vaultId } },
}, { 'PayPal-Mock-Response': JSON.stringify({ mock_application_codes: 'INSTRUMENT_DECLINED' }) });
const pass = res.status === 422 && JSON.stringify(res.body).includes('INSTRUMENT_DECLINED');
if (!pass) console.log(JSON.stringify(res.body, null, 2));
record('S3 extra. Method C with intent CAPTURE', pass, [res],
  pass ? 'Mock header on a CAPTURE order create gives INSTRUMENT_DECLINED. No order created, no money moved.' : `Status ${res.status}. If 201, money WAS captured and must be refunded.`);
process.exit(pass ? 0 : 1);
