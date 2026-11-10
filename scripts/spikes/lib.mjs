// Shared helpers for the sandbox spikes. Plain Node, fetch only.
// Run every spike with: node --env-file=.env scripts/spikes/<file>.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const BASE = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(here, '.state.json');
const RESULTS = path.join(here, 'RESULTS.md');

export function need(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error('Missing in .env: ' + missing.join(', '));
    process.exit(2);
  }
}

export function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return {}; }
}
export function saveState(patch) {
  const s = { ...loadState(), ...patch };
  fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
  return s;
}

let cached;
export async function token() {
  if (cached && cached.exp > Date.now()) return cached.tok;
  need('FUNDER_CLIENT_ID', 'FUNDER_CLIENT_SECRET');
  const basic = Buffer.from(`${process.env.FUNDER_CLIENT_ID}:${process.env.FUNDER_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`OAuth failed ${r.status} debug ${r.headers.get('paypal-debug-id')} ${JSON.stringify(j)}`);
  cached = { tok: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return cached.tok;
}

// One PayPal call. Returns { status, debugId, body, sent }.
export async function pp(method, url, body, extraHeaders = {}) {
  const headers = {
    Authorization: `Bearer ${await token()}`,
    'Content-Type': 'application/json',
    'PayPal-Request-Id': crypto.randomUUID(),
    Prefer: 'return=representation',
    ...extraHeaders,
  };
  const r = await fetch(BASE + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  const out = { status: r.status, debugId: r.headers.get('paypal-debug-id'), body: json, sent: { method, url, body, extraHeaders } };
  console.log(`${method} ${url} -> ${r.status} (debug ${out.debugId})`);
  return out;
}

// Strip emails and secrets before anything goes into git.
function scrub(v) {
  const s = JSON.stringify(v, null, 2) ?? '';
  return s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<email>');
}

export function record(test, pass, calls, note = '') {
  const lines = [
    `\n## ${test}. ${pass ? 'PASS' : 'FAIL'}`,
    `Run at ${new Date().toISOString()}`,
    note ? `\n${note}\n` : '',
  ];
  for (const c of calls) {
    lines.push(`- \`${c.sent.method} ${c.sent.url}\` -> **${c.status}**, debug ID \`${c.debugId}\``);
    if (Object.keys(c.sent.extraHeaders || {}).length) lines.push(`  - extra headers \`${JSON.stringify(c.sent.extraHeaders)}\``);
    if (c.sent.body) lines.push('  <details><summary>sent</summary>\n\n```json\n' + scrub(c.sent.body) + '\n```\n</details>');
    if (!(c.status >= 200 && c.status < 300)) lines.push('  <details><summary>response</summary>\n\n```json\n' + scrub(c.body) + '\n```\n</details>');
  }
  if (!fs.existsSync(RESULTS)) fs.writeFileSync(RESULTS, '# Sandbox spike results\n\nWritten by the scripts in this folder. Emails are masked. No secrets.\n');
  fs.appendFileSync(RESULTS, lines.join('\n') + '\n');
  console.log(`\n${test}: ${pass ? 'PASS' : 'FAIL'}`);
}
