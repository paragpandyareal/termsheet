// Creates the PayPal webhooks (PRD 6.9) pointing at the hosted app, then saves their IDs on Render.
//   node --env-file=.env scripts/seed/webhooks.mjs
const BASE = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';
const HOST = 'https://termsheet-tgwl.onrender.com';
const APPS = {
  funder: { id: 'FUNDER', events: ['VAULT.PAYMENT-TOKEN.CREATED', 'VAULT.PAYMENT-TOKEN.DELETED', 'PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.DENIED', 'PAYMENT.PAYOUTSBATCH.SUCCESS', 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED', 'PAYMENT.PAYOUTS-ITEM.FAILED', 'CUSTOMER.DISPUTE.CREATED'] },
  supplier: { id: 'SUPPLIER', events: ['PAYMENT.CAPTURE.COMPLETED', 'INVOICING.INVOICE.PAID', 'CUSTOMER.DISPUTE.CREATED'] },
};
const out = {};
for (const [app, cfg] of Object.entries(APPS)) {
  const basic = Buffer.from(`${process.env[cfg.id + '_CLIENT_ID']}:${process.env[cfg.id + '_CLIENT_SECRET']}`).toString('base64');
  const tok = (await (await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' })).json()).access_token;
  const url = `${HOST}/api/webhooks/paypal/${app}`;
  const list = await (await fetch(`${BASE}/v1/notifications/webhooks`, { headers: { Authorization: `Bearer ${tok}` } })).json();
  let hook = (list.webhooks || []).find((w) => w.url === url);
  if (!hook) {
    const r = await fetch(`${BASE}/v1/notifications/webhooks`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url, event_types: cfg.events.map((name) => ({ name })) }) });
    hook = await r.json();
    if (!r.ok) { console.log(app, 'FAILED', r.status, r.headers.get('paypal-debug-id'), JSON.stringify(hook).slice(0, 300)); continue; }
  }
  out[`${cfg.id}_WEBHOOK_ID`] = hook.id;
  console.log(`${app} webhook ${hook.id} -> ${url}`);
}
if (process.env.RENDER_API_KEY && Object.keys(out).length) {
  const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };
  const svc = (await (await fetch('https://api.render.com/v1/services?name=termsheet&type=web_service', { headers: h })).json()).map((x) => x.service).find((s) => s.name === 'termsheet');
  for (const [k, v] of Object.entries(out)) {
    const p = await fetch(`https://api.render.com/v1/services/${svc.id}/env-vars/${k}`, { method: 'PUT', headers: h, body: JSON.stringify({ value: v }) });
    console.log(`Render ${k} ${p.ok ? 'set' : 'FAILED ' + p.status}`);
  }
  const d = await fetch(`https://api.render.com/v1/services/${svc.id}/deploys`, { method: 'POST', headers: h, body: '{}' });
  console.log(`Redeploy ${d.ok ? 'started' : 'FAILED ' + d.status}`);
}
