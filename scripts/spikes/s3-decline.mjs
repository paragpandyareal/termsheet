// S3. Test decline. Methods A, then B, then C (PRD 6.6). Voids any real authorisation.
// node --env-file=.env scripts/spikes/s3-decline.mjs
import { pp, record, loadState } from './lib.mjs';

const { vaultId } = loadState();
if (!vaultId) { console.error('No vault ID. Finish S1 first.'); process.exit(1); }

const MOCK = { 'PayPal-Mock-Response': JSON.stringify({ mock_application_codes: 'INSTRUMENT_DECLINED' }) };
const isDecline = (r) => r.status >= 400 && JSON.stringify(r.body || '').includes('INSTRUMENT_DECLINED');
const orderBody = (tag) => ({
  intent: 'AUTHORIZE',
  purchase_units: [{ reference_id: tag, invoice_id: `TS-${tag}`, amount: { currency_code: 'USD', value: '15.00' } }],
  payment_source: { paypal: { vault_id: vaultId } },
});
const calls = [];
const voidAuth = async (authId) => { if (authId) calls.push(await pp('POST', `/v2/payments/authorizations/${authId}/void`)); };
const authOf = (r) => r.body?.purchase_units?.[0]?.payments?.authorizations?.[0];
let winner = null;

// Method A. Real AUTHORIZE order, mock decline on capture, then void.
const a = await pp('POST', '/v2/checkout/orders', orderBody(`S3A-${Date.now()}`));
calls.push(a);
let auth = authOf(a);
if (auth?.id) {
  const cap = await pp('POST', `/v2/payments/authorizations/${auth.id}/capture`, {}, MOCK);
  calls.push(cap);
  if (isDecline(cap)) winner = { method: 'A', debugId: cap.debugId };
  await voidAuth(auth.id);
} else if (a.status < 300 && a.body?.id) {
  // Method B. Order created but not authorised yet. Authorise with the mock header.
  const b = await pp('POST', `/v2/checkout/orders/${a.body.id}/authorize`, {}, MOCK);
  calls.push(b);
  if (isDecline(b)) winner = { method: 'B', debugId: b.debugId };
  else await voidAuth(authOf(b)?.id);
}

// Method B on its own, if A did not produce an order we could use.
if (!winner && !auth?.id && !(a.status < 300)) {
  console.log('Method A order create failed, so B has no order to authorise.');
}

// Method C. Mock header on order create itself.
if (!winner) {
  const c = await pp('POST', '/v2/checkout/orders', orderBody(`S3C-${Date.now()}`), MOCK);
  calls.push(c);
  if (isDecline(c)) winner = { method: 'C', debugId: c.debugId };
  else await voidAuth(authOf(c)?.id);
}

record('S3. Test decline', !!winner, calls,
  winner ? `Method ${winner.method} produced INSTRUMENT_DECLINED. Debug ID of the failed call \`${winner.debugId}\`. Real authorisations were voided.`
         : 'None of A, B or C produced INSTRUMENT_DECLINED. PRD fallback is method D (delete the token first) with the honest label.');
process.exit(winner ? 0 : 1);
