// S1 fallback (PRD 12). Save the account during a small deposit order instead.
// start: creates the order and prints the approval link. finish: captures and reads the vault ID.
import { pp, record, saveState, loadState } from './lib.mjs';
const step = process.argv[2];
if (step === 'start') {
  const res = await pp('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{ reference_id: `S1F-${Date.now()}`, description: 'Net 30 for Business (concept). Deposit', amount: { currency_code: 'USD', value: '1.00' } }],
    payment_source: { paypal: {
      attributes: { vault: { store_in_vault: 'ON_SUCCESS', usage_type: 'MERCHANT', customer_type: 'BUSINESS', permit_multiple_payment_tokens: false } },
      experience_context: { brand_name: 'TermSheet Funding', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW',
        return_url: 'https://example.com/apply/return', cancel_url: 'https://example.com/apply/cancel' },
    } },
  });
  if (res.status >= 300) { console.log(JSON.stringify(res.body, null, 2)); record('S1 fallback step 1 (deposit order with save)', false, [res]); process.exit(1); }
  saveState({ s1fOrderId: res.body.id, s1fStartCall: { status: res.status, debugId: res.debugId, sent: res.sent } });
  console.log(`\nAPPROVAL LINK:\n${res.body.links.find((l) => l.rel === 'payer-action' || l.rel === 'approve').href}\n`);
} else if (step === 'finish') {
  const st = loadState();
  const res = await pp('POST', `/v2/checkout/orders/${st.s1fOrderId}/capture`, {});
  const v = res.body?.payment_source?.paypal?.attributes?.vault;
  const ok = res.status < 300 && v?.id;
  if (ok) saveState({ vaultId: v.id, customerId: v.customer?.id });
  else console.log(JSON.stringify(res.body, null, 2));
  record('S1 fallback. Save PayPal account during a $1 deposit order', !!ok, [{ ...st.s1fStartCall, body: null }, res],
    ok ? `Vault status ${v.status}. Vault ID stored in the git ignored .state.json.` : '');
  process.exit(ok ? 0 : 1);
}
