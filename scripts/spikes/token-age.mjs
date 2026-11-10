// Shows whether PayPal is reusing an old access token (and its old permissions). No secrets printed.
import { BASE } from './lib.mjs';
const basic = Buffer.from(`${process.env.FUNDER_CLIENT_ID}:${process.env.FUNDER_CLIENT_SECRET}`).toString('base64');
const r = await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
const j = await r.json();
console.log('expires_in', j.expires_in, '(a fresh token is about 32400)');
console.log('scope count', (j.scope || '').split(' ').length);
