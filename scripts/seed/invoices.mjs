// Seeds Ridgeline PayPal invoices (PRD 11.2 "Late invoices"). Creates, sends, sends 2 reminders,
// then records the payment with a note (the PRD fallback, so no one has to pay by hand). Safe to re run.
//   node --env-file=.env scripts/seed/invoices.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(here, 'SEED_LOG.md');
const PLAN = [
  { buyer: 'BUYER_LARKSPUR_EMAIL', no: 'RR-INV-LA-01', cents: 84000, label: 'Larkspur' },
  { buyer: 'BUYER_LARKSPUR_EMAIL', no: 'RR-INV-LA-02', cents: 126500, label: 'Larkspur' },
  { buyer: 'BUYER_SECONDSHOT_EMAIL', no: 'RR-INV-SE-01', cents: 97000, label: 'Second Shot' },
];

const basic = Buffer.from(`${process.env.SUPPLIER_CLIENT_ID}:${process.env.SUPPLIER_CLIENT_SECRET}`).toString('base64');
const tok = (await (await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' })).json()).access_token;
const call = async (method, url, body) => {
  const r = await fetch(BASE + url, { method, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let j; try { j = t ? JSON.parse(t) : {}; } catch { j = { raw: t }; }
  return { ok: r.ok, status: r.status, debug: r.headers.get('paypal-debug-id'), body: j };
};
const usd = (c) => (c / 100).toFixed(2);

const existing = await call('GET', '/v2/invoicing/invoices?page_size=100&total_required=false');
for (const p of PLAN) {
  if ((existing.body.items || []).some((i) => i.detail?.invoice_number === p.no)) { console.log(`${p.no} exists, skipped`); continue; }
  const c = await call('POST', '/v2/invoicing/invoices', {
    detail: { currency_code: 'USD', invoice_number: p.no, note: 'Ridgeline Roasters wholesale coffee. Net 14.', payment_term: { term_type: 'NET_10' } },
    invoicer: { business_name: 'Ridgeline Roasters' },
    primary_recipients: [{ billing_info: { email_address: process.env[p.buyer] } }],
    items: [{ name: 'Wholesale coffee, monthly standing order', quantity: '1', unit_amount: { currency_code: 'USD', value: usd(p.cents) } }],
  });
  const id = c.body.id || c.body.href?.split('/').pop();
  if (!c.ok || !id) { console.log(`${p.no} create FAILED ${c.status} ${c.debug}`, JSON.stringify(c.body).slice(0, 300)); continue; }
  const s = await call('POST', `/v2/invoicing/invoices/${id}/send`, { send_to_recipient: true });
  const r1 = await call('POST', `/v2/invoicing/invoices/${id}/remind`, { subject: 'Reminder: invoice overdue', note: 'First reminder. This invoice is past due.' });
  const r2 = await call('POST', `/v2/invoicing/invoices/${id}/remind`, { subject: 'Second reminder: invoice overdue', note: 'Second reminder. This invoice is past due.' });
  const pay = await call('POST', `/v2/invoicing/invoices/${id}/payments`, { method: 'PAYPAL', payment_date: new Date().toISOString().slice(0, 10), amount: { currency_code: 'USD', value: usd(p.cents) }, note: 'Paid late, after the second reminder.' });
  const line = `${p.label} invoice ${p.no} $${usd(p.cents)}: create ${c.status}, send ${s.status}, reminder ${r1.status}, reminder ${r2.status}, record payment ${pay.status} (debug ${pay.debug}).`;
  fs.appendFileSync(LOG, `- ${new Date().toISOString()} ${line}\n`);
  console.log(line);
}
