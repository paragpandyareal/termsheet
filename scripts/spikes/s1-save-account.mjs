// S1. Save a PayPal account without a purchase, on the funder app.
// Step 1: node --env-file=.env scripts/spikes/s1-save-account.mjs start
//         prints an approval link. Log in as Larkspur Cafe and approve.
// Step 2: node --env-file=.env scripts/spikes/s1-save-account.mjs finish
//         swaps the setup token for a payment token and saves the vault ID locally.
import { pp, record, saveState, loadState } from './lib.mjs';

const step = process.argv[2];

if (step === 'start') {
  const res = await pp('POST', '/v3/vault/setup-tokens', {
    payment_source: {
      paypal: {
        description: 'Net 30 for Business (concept). Charged on each order\'s due date, up to your limit.',
        usage_type: 'MERCHANT',
        customer_type: 'BUSINESS',
        permit_multiple_payment_tokens: false,
        experience_context: {
          brand_name: 'TermSheet Funding',
          shipping_preference: 'NO_SHIPPING',
          return_url: 'https://example.com/apply/return',
          cancel_url: 'https://example.com/apply/cancel',
        },
      },
    },
  });
  if (res.status >= 300) {
    console.log(JSON.stringify(res.body, null, 2));
    record('S1 step 1 (create setup token)', false, [res]);
    process.exit(1);
  }
  const approve = res.body.links?.find((l) => l.rel === 'approve')?.href;
  saveState({ setupTokenId: res.body.id, s1StartCall: { status: res.status, debugId: res.debugId, sent: res.sent } });
  console.log(`\nSetup token ${res.body.id}, status ${res.body.status}`);
  console.log(`\nAPPROVAL LINK:\n${approve}\n`);
} else if (step === 'finish') {
  const st = loadState();
  if (!st.setupTokenId) { console.error('Run "start" first.'); process.exit(1); }
  const res = await pp('POST', '/v3/vault/payment-tokens', {
    payment_source: { token: { id: st.setupTokenId, type: 'SETUP_TOKEN' } },
  });
  const ok = res.status < 300 && res.body?.id;
  const calls = [{ ...st.s1StartCall, body: null }, res];
  if (ok) {
    saveState({
      vaultId: res.body.id,
      customerId: res.body.customer?.id,
      payerEmail: res.body.payment_source?.paypal?.email_address,
    });
    console.log(`Vault ID saved locally. Customer ${res.body.customer?.id}`);
    record('S1. Save PayPal account without purchase', true, calls,
      `Vault ID came back and is stored in the git ignored file scripts/spikes/.state.json. payment_source keys returned: ${Object.keys(res.body.payment_source || {}).join(', ')}.`);
  } else {
    console.log(JSON.stringify(res.body, null, 2));
    record('S1. Save PayPal account without purchase', false, calls);
    process.exit(1);
  }
} else {
  console.log('Use "start" or "finish".');
}
