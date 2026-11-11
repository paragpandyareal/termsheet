// Copies the keys from .env to the Render web service "termsheet", then starts a deploy.
// Needs RENDER_API_KEY in .env (Render dashboard, Account settings, API Keys). Prints key names only, never values.
//   node --env-file=.env scripts/seed/render-env.mjs check
//   node --env-file=.env scripts/seed/render-env.mjs push
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.render.com/v1';
const KEY = process.env.RENDER_API_KEY;
if (!KEY) { console.error('Add RENDER_API_KEY to .env first.'); process.exit(1); }
const h = { Authorization: `Bearer ${KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };

const VARS = ['FUNDER_CLIENT_ID', 'FUNDER_CLIENT_SECRET', 'SUPPLIER_CLIENT_ID', 'SUPPLIER_CLIENT_SECRET', 'SUPPLIER_EMAIL',
  'LARKSPUR_CLIENT_ID', 'LARKSPUR_CLIENT_SECRET', 'SECONDSHOT_CLIENT_ID', 'SECONDSHOT_CLIENT_SECRET',
  'BUYER_LARKSPUR_EMAIL', 'BUYER_SECONDSHOT_EMAIL', 'WALKIN_EMAIL', 'ANTHROPIC_API_KEY', 'FUNDER_WEBHOOK_ID', 'SUPPLIER_WEBHOOK_ID'];

const r = await fetch(`${API}/services?name=termsheet&type=web_service&limit=5`, { headers: h });
if (!r.ok) { console.error('Render API error', r.status); process.exit(1); }
const list = await r.json();
const svc = list.map((x) => x.service).find((s) => s.name === 'termsheet');
if (!svc) { console.error('No Render web service named "termsheet" yet. Create it from the Blueprint first.'); process.exit(1); }
const url = svc.serviceDetails?.url;
console.log(`Found service ${svc.id} at ${url}`);
if (process.argv[2] !== 'push') process.exit(0);

const here = path.dirname(fileURLToPath(import.meta.url));
let seedVault;
try { seedVault = JSON.parse(fs.readFileSync(path.join(here, '.seed-state.json'), 'utf8')).vaults?.['funder:secondshot']?.id; } catch {}

const values = Object.fromEntries(VARS.filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
if (url) values.APP_BASE_URL = url;
if (seedVault) values.SEED_VAULT_FUNDER_SECONDSHOT = seedVault;
for (const [k, v] of Object.entries(values)) {
  const p = await fetch(`${API}/services/${svc.id}/env-vars/${k}`, { method: 'PUT', headers: h, body: JSON.stringify({ value: v }) });
  console.log(`${k.padEnd(30)} ${p.ok ? 'set' : 'FAILED ' + p.status}`);
}
const d = await fetch(`${API}/services/${svc.id}/deploys`, { method: 'POST', headers: h, body: JSON.stringify({ clearCache: 'do_not_clear' }) });
console.log(`Deploy started: ${d.ok ? 'yes' : 'FAILED ' + d.status}. Watch it in the Render dashboard.`);
