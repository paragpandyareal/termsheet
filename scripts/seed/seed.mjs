// Seeding (PRD section 11). Real sandbox calls only. Safe to re run.
//
//   node --env-file=.env scripts/seed/seed.mjs status
//   node --env-file=.env scripts/seed/seed.mjs link <app> <payer>     prints an approval link
//   node --env-file=.env scripts/seed/seed.mjs finish <app> <payer>   stores the saved account
//   node --env-file=.env scripts/seed/seed.mjs history <buyer>        past Ridgeline orders (supplier app)
//   node --env-file=.env scripts/seed/seed.mjs sales <buyer>          walk in cafe sales (buyer's own app)
//
// apps: funder, supplier, larkspur, secondshot     payers: larkspur, secondshot, walkin
// Saved account IDs live in scripts/seed/.seed-state.json, which git ignores.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const BASE = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(here, '.seed-state.json');
const LOG = path.join(here, 'SEED_LOG.md');

const APPS = {
  funder: ['FUNDER_CLIENT_ID', 'FUNDER_CLIENT_SECRET', 'TermSheet Funding'],
  supplier: ['SUPPLIER_CLIENT_ID', 'SUPPLIER_CLIENT_SECRET', 'Ridgeline Roasters'],
  larkspur: ['LARKSPUR_CLIENT_ID', 'LARKSPUR_CLIENT_SECRET', 'Larkspur Cafe'],
  secondshot: ['SECONDSHOT_CLIENT_ID', 'SECONDSHOT_CLIENT_SECRET', 'Second Shot Cafe'],
};
const PAYERS = { larkspur: 'BUSINESS', secondshot: 'BUSINESS', northgate: 'BUSINESS', walkin: 'CONSUMER' };

// Deterministic plans so a re run creates the same history.
const HISTORY = { larkspur: 14, secondshot: 9, northgate: 8 };
const AVG = { larkspur: 1150, secondshot: 1150, northgate: 1800 };
const SALES = { larkspur: { count: 40, total: 18400 }, secondshot: { count: 30, total: 11000 } };

const load = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { vaults: {}, pending: {}, history: {}, sales: {} }; } };
const save = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
const log = (line) => {
  if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, '# Seed log\n\nWritten by scripts/seed/seed.mjs. Real PayPal sandbox calls. No secrets or saved account IDs.\n\n');
  fs.appendFileSync(LOG, `- ${new Date().toISOString()} ${line}\n`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tokens = {};
async function token(app) {
  if (tokens[app]) return tokens[app];
  const [idVar, secVar] = APPS[app] || [];
  if (!idVar || !process.env[idVar] || !process.env[secVar]) throw new Error(`Missing keys for app "${app}" (${idVar}, ${secVar}) in .env`);
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${process.env[idVar]}:${process.env[secVar]}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`OAuth ${app} ${r.status}`);
  return (tokens[app] = j.access_token);
}
async function pp(app, method, url, body, requestId) {
  const r = await fetch(BASE + url, {
    method,
    headers: { Authorization: `Bearer ${await token(app)}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': requestId || crypto.randomUUID(), Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, debugId: r.headers.get('paypal-debug-id'), body: j };
}

// Spread a total over n amounts with a gentle, repeatable wobble. Returns cents.
function spread(n, totalDollars, min, max, seed) {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const raw = Array.from({ length: n }, () => min + rnd() * (max - min));
  const k = (totalDollars * 100) / raw.reduce((a, b) => a + b * 100, 0);
  const cents = raw.map((v) => Math.round(v * 100 * k));
  cents[n - 1] += totalDollars * 100 - cents.reduce((a, b) => a + b, 0);
  return cents;
}
const usd = (c) => (c / 100).toFixed(2);

const [cmd, a1, a2] = process.argv.slice(2);
const s = load();

if (cmd === 'status') {
  console.log('Saved accounts:', Object.keys(s.vaults).join(', ') || 'none');
  console.log('Waiting for approval:', Object.keys(s.pending).join(', ') || 'none');
  console.log('Ridgeline history done:', JSON.stringify(s.history));
  console.log('Cafe sales done:', JSON.stringify(s.sales));
} else if (cmd === 'link') {
  if (!APPS[a1] || !PAYERS[a2]) throw new Error('Usage: link <app> <payer>');
  const res = await pp(a1, 'POST', '/v3/vault/setup-tokens', {
    payment_source: { paypal: {
      description: `${APPS[a1][2]} saves your PayPal account for future orders (sandbox seeding).`,
      usage_type: 'MERCHANT', customer_type: PAYERS[a2], permit_multiple_payment_tokens: false,
      experience_context: { brand_name: APPS[a1][2], shipping_preference: 'NO_SHIPPING', return_url: 'https://example.com/seed/return', cancel_url: 'https://example.com/seed/cancel' },
    } },
  });
  if (res.status >= 300) { console.log(res.status, res.debugId, JSON.stringify(res.body)); process.exit(1); }
  s.pending[`${a1}:${a2}`] = res.body.id; save(s);
  console.log(`\nLog in as ${a2} and approve:\n${res.body.links.find((l) => l.rel === 'approve').href}\n`);
} else if (cmd === 'finish') {
  const key = `${a1}:${a2}`;
  if (!s.pending[key]) throw new Error(`Nothing pending for ${key}. Run link first.`);
  const res = await pp(a1, 'POST', '/v3/vault/payment-tokens', { payment_source: { token: { id: s.pending[key], type: 'SETUP_TOKEN' } } });
  if (!res.body.id) { console.log(res.status, res.debugId, JSON.stringify(res.body)); process.exit(1); }
  s.vaults[key] = { id: res.body.id, customerId: res.body.customer?.id }; delete s.pending[key]; save(s);
  log(`Saved ${a2} account on the ${a1} app. Debug ${res.debugId}.`);
  console.log(`Saved ${a2} on ${a1}.`);
} else if (cmd === 'history' || cmd === 'sales') {
  const buyer = a1;
  const isHist = cmd === 'history';
  const app = isHist ? 'supplier' : buyer;
  const vault = s.vaults[isHist ? `supplier:${buyer}` : `${buyer}:walkin`];
  if (!vault) throw new Error(`No saved account. Run: link ${isHist ? 'supplier ' + buyer : buyer + ' walkin'}`);
  const plan = isHist
    ? spread(HISTORY[buyer], HISTORY[buyer] * AVG[buyer], 600, 1900, buyer.length * 7)
    : spread(SALES[buyer].count, SALES[buyer].total, 120, 800, buyer.length * 13);
  const done = (isHist ? s.history : s.sales)[buyer] ||= [];
  for (let i = done.length; i < plan.length; i++) {
    const ref = isHist ? `RR-${buyer.slice(0, 2).toUpperCase()}-${1001 + i}` : `${buyer.slice(0, 2).toUpperCase()}-TILL-${2001 + i}`;
    const res = await pp(app, 'POST', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: ref, invoice_id: `SEED-${ref}`,
        description: isHist ? `Ridgeline wholesale coffee order ${ref}` : `Counter sales batch ${ref}`,
        amount: { currency_code: 'USD', value: usd(plan[i]) },
      }],
      payment_source: { paypal: { vault_id: vault.id } },
    }, `seed-${cmd}-${buyer}-${i}`);
    const cap = res.body?.purchase_units?.[0]?.payments?.captures?.[0];
    if (res.status >= 300 || cap?.status !== 'COMPLETED') {
      console.log(`Stopped at ${i + 1}/${plan.length}: ${res.status} debug ${res.debugId}`, JSON.stringify(res.body).slice(0, 400));
      save(s); process.exit(1);
    }
    done.push({ ref, orderId: res.body.id, captureId: cap.id, cents: plan[i] });
    save(s);
    console.log(`${i + 1}/${plan.length} ${ref} $${usd(plan[i])} capture ${cap.id}`);
    await sleep(1000);
  }
  const total = done.reduce((a, b) => a + b.cents, 0);
  log(`${isHist ? 'Ridgeline history' : 'Cafe sales'} for ${buyer}: ${done.length} captures, $${usd(total)}.`);
  console.log(`Done. ${done.length} captures, $${usd(total)}.`);
} else {
  console.log('Commands: status | link <app> <payer> | finish <app> <payer> | history <buyer> | sales <buyer>');
}
