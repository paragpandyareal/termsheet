// Sets one non-secret setting on the Render service and redeploys.
//   node --env-file=.env scripts/seed/render-set.mjs analyst_mode live
const ALLOWED = { analyst_mode: ['live', 'mock'], analyst_runs_per_hour: null };
const [k, v] = process.argv.slice(2);
if (!(k in ALLOWED) || (ALLOWED[k] && !ALLOWED[k].includes(v)) || !v) { console.error('Usage: analyst_mode live|mock, or analyst_runs_per_hour <n>'); process.exit(1); }
const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };
const svc = (await (await fetch('https://api.render.com/v1/services?name=termsheet&type=web_service', { headers: h })).json()).map((x) => x.service).find((s) => s.name === 'termsheet');
const p = await fetch(`https://api.render.com/v1/services/${svc.id}/env-vars/${k.toUpperCase()}`, { method: 'PUT', headers: h, body: JSON.stringify({ value: v }) });
console.log(`${k.toUpperCase()}=${v} ${p.ok ? 'set' : 'FAILED ' + p.status}`);
const d = await fetch(`https://api.render.com/v1/services/${svc.id}/deploys`, { method: 'POST', headers: h, body: '{}' });
console.log(`Redeploy ${d.ok ? 'started' : 'FAILED ' + d.status}`);
