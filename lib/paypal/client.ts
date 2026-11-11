// Direct PayPal REST with fetch (PRD 6). Every call returns the PayPal debug ID.
import crypto from 'node:crypto';

export const PAYPAL_BASE = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';
export type AppKey = 'funder' | 'supplier' | 'larkspur' | 'secondshot';

const CREDS: Record<AppKey, [string, string]> = {
  funder: ['FUNDER_CLIENT_ID', 'FUNDER_CLIENT_SECRET'],
  supplier: ['SUPPLIER_CLIENT_ID', 'SUPPLIER_CLIENT_SECRET'],
  larkspur: ['LARKSPUR_CLIENT_ID', 'LARKSPUR_CLIENT_SECRET'],
  secondshot: ['SECONDSHOT_CLIENT_ID', 'SECONDSHOT_CLIENT_SECRET'],
};
export const hasApp = (app: AppKey) => !!(process.env[CREDS[app][0]] && process.env[CREDS[app][1]]);
export const clientId = (app: AppKey) => process.env[CREDS[app][0]] || '';

const cache = new Map<AppKey, { tok: string; exp: number }>();
export async function accessToken(app: AppKey): Promise<string> {
  const c = cache.get(app);
  if (c && c.exp > Date.now()) return c.tok;
  const [i, s] = CREDS[app];
  const r = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${process.env[i]}:${process.env[s]}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`PayPal OAuth failed for ${app}: ${r.status} debug ${r.headers.get('paypal-debug-id')}`);
  cache.set(app, { tok: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 });
  return j.access_token;
}

export type PPResult<T = any> = { ok: boolean; status: number; debugId: string | null; body: T };

export async function pp<T = any>(app: AppKey, method: string, path: string, body?: unknown, opts: { requestId?: string; headers?: Record<string, string> } = {}): Promise<PPResult<T>> {
  const r = await fetch(PAYPAL_BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken(app)}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      'PayPal-Request-Id': opts.requestId || crypto.randomUUID(),
      ...(opts.headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { ok: r.ok, status: r.status, debugId: r.headers.get('paypal-debug-id'), body: json };
}
