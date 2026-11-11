// S5. Two PayPal JS SDK v5 copies on one page (supplier pay now + funder save account).
// node --env-file=.env scripts/spikes/s5-two-sdk.mjs   then open http://localhost:4455
import http from 'node:http';
import crypto from 'node:crypto';
import { BASE, record } from './lib.mjs';

const apps = {
  supplier: [process.env.SUPPLIER_CLIENT_ID, process.env.SUPPLIER_CLIENT_SECRET],
  funder: [process.env.FUNDER_CLIENT_ID, process.env.FUNDER_CLIENT_SECRET],
};
async function call(app, method, url, body) {
  const [id, sec] = apps[app];
  const t = await (await fetch(`${BASE}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${sec}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' })).json();
  const r = await fetch(BASE + url, { method, headers: { Authorization: `Bearer ${t.access_token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': crypto.randomUUID() }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  const c = { status: r.status, debugId: r.headers.get('paypal-debug-id'), body: j, sent: { method, url: `${url} (${app} app)`, body } };
  calls.push(c);
  console.log(`${app} ${method} ${url} -> ${r.status} (debug ${c.debugId})`);
  return c;
}
const calls = [];
const done = { supplier: false, funder: false };
const finish = () => {
  if (done.supplier && done.funder) {
    record('S5. Two SDK copies on one page', true, calls.map((c) => ({ ...c, body: c.status < 300 ? null : c.body })),
      'Both button sets rendered on one page (namespaces paypalSupplier and paypalFunder) and both completed. Supplier pay now order captured, funder save account produced a vault ID.');
    console.log('\nS5: PASS. You can close the page.');
  }
};

const pageFor = (only) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>S5 two SDKs</title>
<style>body{font-family:system-ui;max-width:480px;margin:24px auto;padding:0 16px;background:#fffaf3;color:#222}h2{font-size:18px}.box{background:#fff;border-radius:12px;padding:16px;margin:12px 0;box-shadow:0 1px 4px #0002}#log{font-size:13px;white-space:pre-wrap}</style>
${only !== 'funder' ? `<script src="https://www.paypal.com/sdk/js?client-id=${apps.supplier[0]}&currency=USD&components=buttons" data-namespace="paypalSupplier" onerror="window.supErr=1"></script>` : ''}
${only !== 'supplier' ? `<script src="https://www.paypal.com/sdk/js?client-id=${apps.funder[0]}&currency=USD&components=buttons" data-namespace="paypalFunder" onerror="window.funErr=1"></script>` : ''}
</head><body><h1>S5 test. ${only ? 'Only the ' + only + ' button' : 'Two PayPal buttons'}</h1>
<div class="box"><h2>1. Pay Ridgeline now ($5.00)</h2><div id="sup"></div></div>
<div class="box"><h2>2. Save account for Net 30 (TermSheet Funding, $0)</h2><div id="fun"></div></div>
<div class="box"><b>Log</b><div id="log"></div></div>
<script>
const log=(m)=>{document.getElementById('log').textContent+=m+'\\n';fetch('/api/log?m='+encodeURIComponent(location.search+' '+m),{method:'POST'})};window.onerror=(m)=>log('Page error: '+m);window.addEventListener('unhandledrejection',(e)=>log('Unhandled: '+(e.reason&&e.reason.message||e.reason)));setTimeout(()=>log('After 5s: sup iframes '+document.querySelectorAll('#sup iframe').length+', fun iframes '+document.querySelectorAll('#fun iframe').length),5000);const ce=console.error;console.error=(...a)=>{log('Console error: '+a.map(String).join(' ').slice(0,400));ce(...a)};const cw=console.warn;console.warn=(...a)=>{log('Console warn: '+a.map(String).join(' ').slice(0,400));cw(...a)};log('Supplier script blocked: '+!!window.supErr+', funder script blocked: '+!!window.funErr);
const post=(u)=>fetch(u,{method:'POST'}).then(r=>r.json());
// Watchdog. PayPal's sandbox sometimes answers the button iframe (www.sandbox.paypal.com/smart/buttons) with HTTP 500.
// render() still resolves and onError never fires, so the button just looks blank. onInit only fires when the real
// button is up, so if it has not fired after 8 s the button is closed and drawn again, up to 3 tries.
function mount(name,sel,ns,opts,tries){tries=tries||1;let ok=false;let b;
  try{b=ns.Buttons(Object.assign({fundingSource:'paypal',onInit:()=>{ok=true;log(name+' button ready (try '+tries+')')},onError:(e)=>log(name+' error: '+e)},opts));
    b.render(sel).then(()=>log(name+' render done'),(e)=>log(name+' render rejected: '+(e&&e.message||e)));}catch(e){return log(name+' SDK failed: '+e)}
  setTimeout(()=>{if(ok)return;
    if(tries>=3)return log(name+' button still blank after 3 tries. PayPal sandbox is probably returning 500 for /smart/buttons (check the devtools Network tab). Use the redirect approval link for now.');
    log(name+' button blank after 8 s (try '+tries+'), drawing it again');
    Promise.resolve(b.close()).catch(()=>{}).then(()=>{document.querySelector(sel).innerHTML='';mount(name,sel,ns,opts,tries+1)});},8000);}
if(window.paypalSupplier)mount('Supplier','#sup',paypalSupplier,{
  createOrder:()=>post('/api/supplier/order').then(j=>j.id),
  onApprove:(d)=>post('/api/supplier/capture/'+d.orderID).then(j=>log('Supplier payment: '+j.status))});
if(window.paypalFunder)mount('Funder','#fun',paypalFunder,{
  createVaultSetupToken:()=>post('/api/funder/setup-token').then(j=>j.id),
  onApprove:(d)=>post('/api/funder/payment-token/'+d.vaultSetupToken).then(j=>log('Funder save: '+j.status))});
</script></body></html>`;

http.createServer(async (req, res) => {
  const json = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  try {
    const q = req.url.match(/^\/(\?only=(supplier|funder))?$/);
    if (q) { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(pageFor(q[2])); }
    if (req.url === '/api/supplier/order') {
      const c = await call('supplier', 'POST', '/v2/checkout/orders', { intent: 'CAPTURE', purchase_units: [{ description: 'S5 test, Ridgeline beans', amount: { currency_code: 'USD', value: '5.00' } }] });
      return json({ id: c.body.id });
    }
    let m;
    if ((m = req.url.match(/^\/api\/supplier\/capture\/(\w+)$/))) {
      const c = await call('supplier', 'POST', `/v2/checkout/orders/${m[1]}/capture`);
      if (c.body.status === 'COMPLETED') { done.supplier = true; finish(); }
      return json({ status: c.body.status || c.status });
    }
    if (req.url === '/api/funder/setup-token') {
      const c = await call('funder', 'POST', '/v3/vault/setup-tokens', { payment_source: { paypal: { usage_type: 'MERCHANT', customer_type: 'BUSINESS', description: 'Net 30 for Business (concept). S5 test.', experience_context: { brand_name: 'TermSheet Funding', shipping_preference: 'NO_SHIPPING', return_url: 'https://example.com/return', cancel_url: 'https://example.com/cancel' } } } });
      return json({ id: c.body.id });
    }
    if ((m = req.url.match(/^\/api\/funder\/payment-token\/(\w+)$/))) {
      const c = await call('funder', 'POST', '/v3/vault/payment-tokens', { payment_source: { token: { id: m[1], type: 'SETUP_TOKEN' } } });
      if (c.body.id) { done.funder = true; finish(); }
      return json({ status: c.body.id ? 'SAVED' : c.status });
    }
    if (req.url.startsWith('/api/log?m=')) { console.log('PAGE LOG', decodeURIComponent(req.url.slice(11))); res.writeHead(204); return res.end(); }
    res.writeHead(404); res.end();
  } catch (e) { console.error(e); res.writeHead(500); res.end(String(e)); }
}).listen(4455, () => console.log('Open http://localhost:4455'));
