// Sets one non-secret setting on the Render service and redeploys.
//   node --env-file=.env scripts/seed/render-set.mjs analyst_mode live
const ALLOWED = { analyst_mode: ['live', 'mock'], analyst_runs_per_hour: null, analyst_runs_per_day: null, anthropic_model: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'], anthropic_effort: ['low', 'medium', 'high'] };
const [k, v] = process.argv.slice(2);
if (!(k in ALLOWED) || (ALLOWED[k] && !ALLOWED[k].includes(v)) || !v) { console.error('Usage: ' + Object.keys(ALLOWED).join(', ') + ' then a value'); process.exit(1); }
const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };
const svc = (await (await fetch('https://api.render.com/v1/services?name=termsheet&type=web_service', { headers: h })).json()).map((x) => x.service).find((s) => s.name === 'termsheet');
const p = await fetch(`https://api.render.com/v1/services/${svc.id}/env-vars/${k.toUpperCase()}`, { method: 'PUT', headers: h, body: JSON.stringify({ value: v }) });
console.log(`${k.toUpperCase()}=${v} ${p.ok ? 'set' : 'FAILED ' + p.status}`);
if (process.argv[4] === 'nodeploy') process.exit(0);
const d = await fetch(`https://api.render.com/v1/services/${svc.id}/deploys`, { method: 'POST', headers: h, body: '{}' });
console.log(`Redeploy ${d.ok ? 'started' : 'FAILED ' + d.status}`);
