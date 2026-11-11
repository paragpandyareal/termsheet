'use client';
// Application and Analyst panel (PRD 4.2). Live tool trace, memo with citation chips, evidence grid, decision, consent, save account.
import { use, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Nav, Chip, MoneyStrip, useAppState, usd } from '@/components/money';
import { REASONS } from '@/lib/scorecard/scorecard';

type Row = { type: string; name?: string; args?: any; summary?: string; ms?: number; status?: string; errors?: string[]; outcome?: string };

export default function Apply({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const q = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [trace, setTrace] = useState<Row[]>([]);
  const [final, setFinal] = useState<any>(null);
  const [hl, setHl] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [s, loadState] = useAppState(5000);
  const [form, setForm] = useState({ businessName: '', businessType: 'Café', foundedYear: '', shipTo: '', letter: '' });
  const gridRef = useRef<HTMLDivElement>(null);

  const load = () => fetch(`/api/apply/${orderId}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => {
    setData(d);
    setForm((f) => f.businessName ? f : { ...f, businessName: d.order?.display_name || '', foundedYear: d.order?.key === 'northgate' ? '2019' : d.order?.key === 'larkspur' ? '2019' : '', shipTo: d.order?.ship_to || '' });
    if (d.run?.status === 'DONE') setTrace(d.run.trace_json || []);
    else if (d.run && !final) stream(d.run.id);
  });
  useEffect(() => { load(); }, [orderId]);
  useEffect(() => { if (q.get('saved')) { const t = setInterval(() => { load(); loadState(); }, 3000); return () => clearInterval(t); } }, [q]);

  const stream = (runId: string) => {
    setTrace([]);
    const es = new EventSource(`/api/analyst/${runId}`);
    es.onmessage = (e) => setTrace((t) => [...t, JSON.parse(e.data)]);
    es.addEventListener('final', (e: any) => { setFinal(JSON.parse(e.data)); es.close(); load(); });
    es.onerror = () => es.close();
  };
  const submit = async () => {
    setFinal(null);
    const r = await fetch(`/api/apply/${orderId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then((r) => r.json());
    if (r.runId) stream(r.runId);
  };
  const save = async () => {
    setSaving(true); setErr('');
    const r = await fetch(`/api/apply/${orderId}/save`, { method: 'POST' }).then((r) => r.json());
    if (r.approveUrl) window.location.href = r.approveUrl;
    else { setErr(`Could not start PayPal. Debug ID ${r.debugId || 'n/a'}`); setSaving(false); }
  };
  const cite = (id: string) => { setHl(id); document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  const order = data?.order;
  const out = final?.output || (data?.app?.decision_json && data?.run?.status === 'DONE' ? data.app.decision_json : null);
  const evidence: any[] = final?.evidence || data?.evidence || [];
  const evIndex = new Map(evidence.map((e, i) => [e.evidence_id, i + 1]));
  const started = !!data?.run || trace.length > 0;
  const approved = out && (out.outcome === 'APPROVE' || out.outcome === 'COUNTEROFFER');
  const saved = data?.line?.saved && data?.payout;
  const mode = final?.mode || data?.run?.mode;

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Net 30 for Business (concept)</div>
          <h1 className="text-2xl font-bold">{order ? `${order.display_name} · order ${order.order_no} · ${usd(order.amount_cents)}` : 'Loading…'}</h1>
        </div>

        {!started && order && (
          <section className="card p-4 grid sm:grid-cols-2 gap-3">
            {([['businessName', 'Business name'], ['businessType', 'Business type'], ['foundedYear', 'Year founded'], ['shipTo', 'Shipping address']] as const).map(([k, l]) => (
              <label key={k} className="text-sm"><span className="muted">{l}</span>
                <input className="card w-full px-2 py-1.5 mt-1" value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
            ))}
            <label className="text-sm sm:col-span-2"><span className="muted">Reference letter (optional, paste text){order.key === 'northgate' ? '. Northgate’s letter is on file.' : ''}</span>
              <textarea className="card w-full px-2 py-1.5 mt-1" rows={3} value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value.slice(0, 200000) })} /></label>
            <div className="sm:col-span-2"><button className="btn" onClick={submit}>Submit application</button></div>
          </section>
        )}

        {started && (
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="card p-4 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">Analyst trace</div>
                <span className="text-xs muted">{mode === 'live' ? `Live AI · ${final?.model || data?.run?.model}` : 'Practice mode. Live PayPal reads, rule based writer, no AI call'}</span>
              </div>
              <div className="mt-2 space-y-1">
                {trace.filter((t) => t.type === 'tool_end' || t.type === 'validate').map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm items-start">
                    <span className="mono shrink-0" style={{ color: t.status === 'error' || (t.type === 'validate' && t.errors?.length) ? 'var(--bad)' : 'var(--accent)' }}>{t.type === 'validate' ? 'validate' : t.name}</span>
                    <span className="min-w-0 break-words">{t.type === 'validate' ? (t.errors?.length ? t.errors.join('; ') : 'Every sentence cites real evidence. Within the scorecard ceiling.') : t.summary}</span>
                    {t.ms !== undefined && <span className="mono muted ml-auto shrink-0">{(t.ms / 1000).toFixed(1)}s</span>}
                  </div>
                ))}
                {!out && <div className="text-sm muted animate-pulse">Working…</div>}
              </div>
            </div>

            <div className="card p-4 min-w-0">
              <div className="font-bold">Credit memo</div>
              {!out && <p className="text-sm muted mt-2">The memo appears when the analyst finishes.</p>}
              {out && (
                <div className="mt-2 space-y-2 text-sm">
                  {out.memo?.map((m: any, i: number) => (
                    <p key={i}>{m.text} {m.evidence_ids?.map((id: string) => <button key={id} onClick={() => cite(id)} className="chip mx-0.5" title={id}>{evIndex.get(id) ?? '?'}</button>)}</p>
                  ))}
                  {out.contradictions?.map((m: any, i: number) => (
                    <p key={'c' + i} style={{ color: 'var(--bad)' }}>⚠ {m.text} {m.evidence_ids?.map((id: string) => <button key={id} onClick={() => cite(id)} className="chip mx-0.5">{evIndex.get(id) ?? '?'}</button>)}</p>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {out && (
          <section className="card p-4" style={{ borderColor: approved ? 'var(--accent)' : 'var(--bad)', borderWidth: 2 }}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-bold">{out.outcome === 'APPROVE' ? 'Approved' : out.outcome === 'COUNTEROFFER' ? 'Counteroffer' : out.outcome === 'DECLINE' ? 'Declined' : 'Sent to review'}</span>
              {approved && <span>Net {out.term_days} · limit {usd(out.limit_cents)}{out.deposit_pct ? ` · ${out.deposit_pct}% deposit` : ''}</span>}
              {out.tightened_from_scorecard && <Chip kind="plain">analyst tightened the scorecard</Chip>}
              <span className="text-xs muted">Scorecard {data?.app?.scorecard_json?.total ?? '…'}/100, tier {data?.app?.scorecard_json?.ceiling?.tier ?? '…'}</span>
            </div>
            {out.outcome === 'DECLINE' && (
              <div className="mt-2 text-sm">
                <ul className="list-disc pl-5">{out.factor_codes.slice(0, 3).map((c: string) => <li key={c}>{REASONS[c]} ({c})</li>)}</ul>
                <p className="mt-2">You can still pay now on the checkout page.</p>
                <p className="text-xs muted mt-1">Illustrative notice for a concept demo. Not legal advice.</p>
              </div>
            )}
            {approved && !saved && (
              <div className="mt-3">
                <blockquote className="text-sm border-l-4 pl-3" style={{ borderColor: 'var(--accent)' }}>You authorise TermSheet Funding to charge this PayPal account on each order&apos;s due date for amounts you owe, up to your {usd(out.limit_cents)} limit. We message you 3 days before each charge.</blockquote>
                <button className="btn mt-3" disabled={saving} onClick={save}>{saving ? 'Opening PayPal…' : 'Save my PayPal account with TermSheet Funding'}</button>
                <p className="text-xs muted mt-1">Opens PayPal. Nothing is charged today. Log in as larkspur.termsheet@example.com.</p>
                {err && <p className="text-sm mt-1" style={{ color: 'var(--bad)' }}>{err}</p>}
              </div>
            )}
            {saved && (
              <div className="mt-3 text-sm space-y-1">
                <p>✅ PayPal account saved with TermSheet Funding. Charged today: <b>$0.00</b>.</p>
                <p>✅ Ridgeline paid {usd(data.payout.amount_cents)} by PayPal Payout · batch <span className="mono">{data.payout.batch_id}</span> · {data.payout.status}</p>
                <p className="text-xs muted">Due in {out.term_days} days. See the café phone and funder ledger.</p>
              </div>
            )}
          </section>
        )}

        {(saved || q.get('saved')) && <MoneyStrip s={s} />}

        {evidence.length > 0 && (
          <section className="card p-4" ref={gridRef}>
            <div className="font-bold mb-2">Evidence ({evidence.length})</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left muted"><th className="pr-2">#</th><th className="pr-2">Evidence ID</th><th className="pr-2">Source</th><th>Summary</th></tr></thead>
                <tbody>
                  {evidence.map((e, i) => (
                    <tr key={e.evidence_id} id={`ev-${e.evidence_id}`} style={{ background: hl === e.evidence_id ? 'var(--accent-soft)' : undefined }}>
                      <td className="pr-2 align-top">{i + 1}</td>
                      <td className="pr-2 align-top mono break-all">{e.evidence_id}</td>
                      <td className="pr-2 align-top">{e.source}{/Seeded|seed|Orders API/i.test(e.source) || e.evidence_id.startsWith('txn:') || e.evidence_id.startsWith('sales:') ? <> <Chip kind="seeded">SEEDED</Chip></> : null}</td>
                      <td className="align-top">{e.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
