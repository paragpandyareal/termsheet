// The money calls proven in spikes S1 to S4 (see scripts/spikes/RESULTS.md).
import { pp, type AppKey } from './client';

const usd = (cents: number) => (cents / 100).toFixed(2);

// PRD 6.3, spike S1. Save the buyer's PayPal account with no purchase.
export async function createSetupToken(returnUrl: string, cancelUrl: string) {
  const r = await pp('funder', 'POST', '/v3/vault/setup-tokens', {
    payment_source: { paypal: {
      description: "Net 30 for Business (concept). Charged on each order's due date, up to your limit.",
      usage_type: 'MERCHANT', customer_type: 'BUSINESS', permit_multiple_payment_tokens: false,
      experience_context: { brand_name: 'TermSheet Funding', shipping_preference: 'NO_SHIPPING', return_url: returnUrl, cancel_url: cancelUrl },
    } },
  });
  return { ...r, id: r.body?.id as string | undefined, approveUrl: r.body?.links?.find((l: any) => l.rel === 'approve')?.href as string | undefined };
}

export async function exchangeSetupToken(setupTokenId: string) {
  const r = await pp('funder', 'POST', '/v3/vault/payment-tokens', { payment_source: { token: { id: setupTokenId, type: 'SETUP_TOKEN' } } }, { requestId: `pt-${setupTokenId}` });
  return { ...r, vaultId: r.body?.id as string | undefined, customerId: r.body?.customer?.id as string | undefined, payerEmail: r.body?.payment_source?.paypal?.email_address as string | undefined };
}

export async function deleteVault(vaultId: string) {
  return pp('funder', 'DELETE', `/v3/vault/payment-tokens/${vaultId}`);
}

// PRD 6.4, spike S2. Charge with the buyer absent. PRD 6.6 method C, spike S3: mock decline on order create.
export async function chargeVault(args: { vaultId: string; cents: number; referenceId: string; invoiceId: string; description: string; mockDecline?: boolean; requestId: string }) {
  const r = await pp('funder', 'POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{ reference_id: args.referenceId, invoice_id: args.invoiceId, description: args.description, amount: { currency_code: 'USD', value: usd(args.cents) } }],
    payment_source: { paypal: { vault_id: args.vaultId } },
  }, { requestId: args.requestId, headers: args.mockDecline ? { 'PayPal-Mock-Response': JSON.stringify({ mock_application_codes: 'INSTRUMENT_DECLINED' }) } : {} });
  const cap = r.body?.purchase_units?.[0]?.payments?.captures?.[0];
  const completed = r.ok && r.body?.status === 'COMPLETED' && cap?.status === 'COMPLETED';
  const issue = r.body?.details?.[0]?.issue || r.body?.name;
  return { ...r, completed, orderId: r.body?.id as string | undefined, captureId: cap?.id as string | undefined, issue: completed ? null : (issue as string) };
}

// PRD 6.5, spike S4.
export async function sendPayout(args: { email: string; cents: number; batchRef: string; itemRef: string; subject: string; note: string }) {
  const r = await pp('funder', 'POST', '/v1/payments/payouts', {
    sender_batch_header: { sender_batch_id: args.batchRef, email_subject: args.subject },
    items: [{ recipient_type: 'EMAIL', receiver: args.email, amount: { currency: 'USD', value: usd(args.cents) }, sender_item_id: args.itemRef, note: args.note }],
  }, { requestId: args.batchRef });
  return { ...r, batchId: r.body?.batch_header?.payout_batch_id as string | undefined, batchStatus: r.body?.batch_header?.batch_status as string | undefined };
}

export async function getPayout(batchId: string) {
  const r = await pp('funder', 'GET', `/v1/payments/payouts/${batchId}`);
  return { ...r, batchStatus: r.body?.batch_header?.batch_status as string | undefined, itemStatus: r.body?.items?.[0]?.transaction_status as string | undefined, itemId: r.body?.items?.[0]?.payout_item_id as string | undefined };
}

// PRD 6.9. Verify a webhook by inserting the raw body unchanged.
export async function verifyWebhook(app: AppKey, webhookId: string, headers: Headers, rawBody: string) {
  const h = (k: string) => JSON.stringify(headers.get(k) || '');
  const body = `{"auth_algo":${h('paypal-auth-algo')},"cert_url":${h('paypal-cert-url')},"transmission_id":${h('paypal-transmission-id')},"transmission_sig":${h('paypal-transmission-sig')},"transmission_time":${h('paypal-transmission-time')},"webhook_id":${JSON.stringify(webhookId)},"webhook_event":${rawBody}}`;
  const { accessToken, PAYPAL_BASE } = await import('./client');
  const r = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST', headers: { Authorization: `Bearer ${await accessToken(app)}`, 'Content-Type': 'application/json' }, body,
  });
  const j = await r.json().catch(() => ({}));
  return j.verification_status === 'SUCCESS';
}
