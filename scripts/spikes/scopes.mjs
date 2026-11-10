// Prints which permissions (scopes) the funder app token has. No secrets printed.
import { BASE } from './lib.mjs';
const basic = Buffer.from(`${process.env.FUNDER_CLIENT_ID}:${process.env.FUNDER_CLIENT_SECRET}`).toString('base64');
const r = await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
const j = await r.json();
const s = (j.scope || '').split(' ');
console.log('scopes', s.length);
for (const k of ['vault', 'payouts', 'payments/payouts', 'invoic', 'reporting', 'checkout']) console.log(k, s.some((x) => x.includes(k)));
console.log(s.filter((x) => /vault|payout/i.test(x)).join('\n'));
