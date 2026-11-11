// S6. Agent Toolkit reads on the supplier (Ridgeline) app.
// S7. Larkspur reads its own sales with its own app (direct REST).
// node --env-file=.env scripts/spikes/s6s7-reads.mjs
import { PayPalAgentToolkit } from '@paypal/agent-toolkit/openai';
import { BASE, record } from './lib.mjs';

const start = new Date(Date.now() - 30 * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');
const end = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// S6 via the toolkit
const kit = new PayPalAgentToolkit({
  clientId: process.env.SUPPLIER_CLIENT_ID, clientSecret: process.env.SUPPLIER_CLIENT_SECRET,
  configuration: { actions: { transactions: { list: true }, invoices: { list: true }, disputes: { list: true } }, context: { sandbox: true } },
});
console.log('toolkit tools:', kit.getTools().map((t) => t.function.name).join(', '));
const call = async (name, args) => {
  const r = await kit.handleToolCall({ id: name, type: 'function', function: { name, arguments: JSON.stringify(args) } });
  return String(r.content);
};
const tx = await call('list_transactions', { start_date: start, end_date: end });
const inv = await call('list_invoices', { page: 1, page_size: 5 });
const txRows = (tx.match(/"transaction_id"/g) || []).length;
const s6pass = /transaction_details/.test(tx) && txRows > 0;
console.log('S6 list_transactions rows', txRows, '| first 300 chars:', tx.slice(0, 300).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<email>'));
console.log('S6 list_invoices first 200 chars:', inv.slice(0, 200));
const fake = (name, ok, text) => ({ status: ok ? 200 : 'error', debugId: 'n/a (toolkit hides headers)', body: text.slice(0, 500), sent: { method: 'TOOL', url: name, body: null } });
record('S6. Agent Toolkit reads on the supplier app', s6pass, [fake('list_transactions', s6pass, tx), fake('list_invoices', !/error/i.test(inv), inv)],
  `@paypal/agent-toolkit 1.11.0, openai export, handleToolCall with sandbox context. list_transactions returned ${txRows} rows for the last 30 days (the S4 payout to Ridgeline is the only expected row so far). list_invoices was also called; no invoices exist yet. The toolkit does not expose PayPal debug IDs.`);

// S7 direct REST with Larkspur's own app
const basic = Buffer.from(`${process.env.LARKSPUR_CLIENT_ID}:${process.env.LARKSPUR_CLIENT_SECRET}`).toString('base64');
const tok = await (await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' })).json();
const hasReporting = (tok.scope || '').includes('reporting');
const url = `/v1/reporting/transactions?start_date=${start}&end_date=${end}&fields=all&page_size=100`;
const r = await fetch(BASE + url, { headers: { Authorization: `Bearer ${tok.access_token}` } });
const j = await r.json().catch(() => ({}));
const rows = j.transaction_details || [];
const net = rows.reduce((s, t) => s + Number(t.transaction_info?.transaction_amount?.value || 0), 0);
console.log(`S7 status ${r.status}, reporting scope ${hasReporting}, rows ${rows.length}, net ${net.toFixed(2)}`);
record('S7. Larkspur reads its own sales with its own app', r.status === 200, [{ status: r.status, debugId: r.headers.get('paypal-debug-id'), body: r.status === 200 ? null : j, sent: { method: 'GET', url: url.split('?')[0] + '?<last 30 days>', body: null } }],
  `Call works: ${r.status === 200}. Reporting scope on the Larkspur token: ${hasReporting}. Rows ${rows.length}, net ${net.toFixed(2)} USD. **Partial.** No walk in sales are seeded yet, so "totals match seeded sales" cannot be checked until seeding (PRD 11) runs and Transaction Search catches up (3 hours or more).`);
