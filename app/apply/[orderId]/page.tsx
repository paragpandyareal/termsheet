'use client';
// Application and Analyst panel (PRD 4.2). Decision first, then the analyst's live trace and cited memo, then the evidence.
import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Nav, Chip, MoneyStrip, useAppState, usd } from '@/components/money';
import { REASONS } from '@/lib/scorecard/scorecard';

type Row = { at?: number; type: string; name?: string; args?: any; summary?: string; ms?: number; status?: string; errors?: string[]; outcome?: string };
const TOOL_LABEL: Record<string, string> = {
  get_application: 'Read application', list_transactions: 'Ridgeline order history', search_invoices: 'Ridgeline invoices', list_disputes: 'PayPal disputes',
  get_buyer_sales_summary: "Café's own PayPal sales", get_repayment_record: 'TermSheet repayment record', read_document: 'Read reference letter', get_thread: 'Read messages', get_policy: 'Scorecard ceiling',
};

export default function Apply({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const q = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [trace, setTrace] = useState<Row[]>([]);
  const [final, setFinal] = useState<any>(null);
  const [hl, setHl] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [s, loadState] = useAppState(5000);
  const [form, setForm] = useState({ businessName: '', businessType: 'Café', foundedYear: '', shipTo: '', letter: '' });

  const load = () => fetch(`/api/apply/${orderId}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => {
    setData(d);
    setForm((f) => f.businessName ? f : { ...f, businessName: d.order?.display_name || '', foundedYear: d.order?.key === 'secondshot' ? '2021' : '2019', shipTo: d.order?.ship_to || '' });
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
  const cite = (id: string) => { setShowAll(true); setHl(id); setTimeout(() => document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); };

  const order = data?.order;
  const out = final?.output || (data?.run?.status === 'DONE' ? data.app?.decision_json : null);
  const evidence: any[] = final?.evidence || data?.evidence || [];
  const evIndex = new Map(evidence.map((e, i) => [e.evidence_id, i + 1]));
  const started = !!data?.run || trace.length > 0;
  const approved = out && (out.outcome === 'APPROVE' || out.outcome === 'COUNTEROFFER');
  const saved = data?.line?.saved && data?.payout;
  const mode = final?.mode || data?.run?.mode;
  const model = final?.model || data?.run?.model;
  const tools = trace.filter((t) => t.type === 'tool_end');
  const totalMs = trace.length > 1 && trace[0].at && trace[trace.length - 1].at ? trace[trace.length - 1].at! - trace[0].at! : 0;
  const maxMs = Math.max(1, ...tools.map((t) => t.ms || 0));
  const validate = trace.find((t) => t.type === 'validate');
  const sc = data?.app?.scorecard_json;
  const Cites = ({ ids }: { ids: string[] }) => <>{ids?.map((id) => <button key={id} onClick={() => cite(id)} className="chip-btn" aria-label={`Source ${evIndex.get(id) ?? '?'}: ${id}`} title={id}>{evIndex.get(id) ?? '?'}</button>)}</>;

  // Group repeated evidence sources so the table stays readable.
  const groups: { source: string; rows: any[] }[] = [];
  for (const e of evidence) { const g = groups.find((x) => x.source === e.source); if (g) g.rows.push(e); else groups.push({ source: e.source, rows: [e] }); }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="t-label" style={{ color: 'var(--blue)' }}>Net 30 for Business · application</div>
          <h1 className="t-h2 mt-1">{order ? `${order.display_name} · ${usd(order.amount_cents)}` : 'Loading…'}</h1>
          {order && <div className="small muted">Ridgeline order {order.order_no} · ships to {order.ship_to}</div>}
        </div>

        {!started && order && (
          <section className="card p-4 sm:p-8">
            <h2 className="t-h3">Tell us about your business</h2>
            <p className="small muted">Takes under a minute. The AI analyst reads your PayPal history with Ridgeline and your own PayPal sales.</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {([['businessName', 'Business name'], ['businessType', 'Business type'], ['foundedYear', 'Year founded'], ['shipTo', 'Shipping address']] as const).map(([k, l]) => (
                <label key={k} className="small font-semibold">{l}<input className="field font-normal" value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
              ))}
              <label className="small font-semibold sm:col-span-2">Reference letter (optional, paste text){order.key === 'northgate' ? ' · Northgate’s letter is already on file' : ''}
                <textarea className="field font-normal" rows={3} value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value.slice(0, 200000) })} /></label>
            </div>
            <button className="btn btn-lg mt-8" onClick={submit}>Submit application</button>
          </section>
        )}

        {out && (
          <section className="card-hero p-4 sm:p-8 rise" style={{ borderTop: `4px solid ${approved ? 'var(--good)' : out.outcome === 'DECLINE' ? 'var(--bad)' : 'var(--warn)'}` }}>
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <div className="t-label">Decision</div>
                <div className="t-h2 mt-1" style={{ color: approved ? 'var(--good)' : out.outcome === 'DECLINE' ? 'var(--bad)' : 'var(--warn)' }}>
                  {out.outcome === 'APPROVE' ? 'Approved' : out.outcome === 'COUNTEROFFER' ? 'Counteroffer' : out.outcome === 'DECLINE' ? 'Declined' : 'Sent to human review'}
                </div>
              </div>
              {approved && <div><div className="t-label">Credit limit</div><div className="t-hero mt-1" style={{ color: 'var(--navy)' }}>{usd(out.limit_cents)}</div></div>}
              {approved && <div><div className="t-label">Terms</div><div className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Net {out.term_days}{out.deposit_pct ? ` · ${out.deposit_pct}% deposit` : ''}</div></div>}
              {sc && <div><div className="t-label">Scorecard · plain code</div><div className="text-xl font-bold" style={{ color: 'var(--navy)' }}>{sc.total}/100 · tier {sc.ceiling.tier}</div><div className="small muted">Ceiling {sc.ceiling.outcome === 'DECLINE' ? 'decline' : usd(sc.ceiling.limitCents)}. The AI can only go lower.</div></div>}
              {out.tightened_from_scorecard && <span className="chip chip-warn">Analyst went below the scorecard</span>}
            </div>
            {out.summary && <p className="mt-4 text-[17px]">{out.summary}</p>}
            {out.tightening_reason && <p className="small mt-2"><b>Why the analyst went below the scorecard:</b> {out.tightening_reason}</p>}
            {out.outcome === 'DECLINE' && (
              <div className="mt-4">
                <div className="font-semibold">Main reasons</div>
                <ul className="list-disc pl-5 mt-1">{out.factor_codes.filter((c: string) => REASONS[c]).sort((a: string, b: string) => (['OB07', 'VR06'].includes(b) ? 1 : 0) - (['OB07', 'VR06'].includes(a) ? 1 : 0)).slice(0, 3).map((c: string) => <li key={c}>{REASONS[c]}</li>)}</ul>
                <p className="small mt-2">The café can still pay now at checkout. <span className="muted">Illustrative notice for a concept demo. Not legal advice.</span></p>
              </div>
            )}
            {approved && !saved && (
              <div className="mt-8 pt-8 border-t">
                <p className="small callout-blue">You authorise TermSheet Funding to charge this PayPal account on each order&apos;s due date for amounts you owe, up to your {usd(out.limit_cents)} limit. We message you 3 days before each charge.</p>
                <button className="btn btn-lg mt-4" disabled={saving} onClick={save}>{saving ? 'Opening PayPal…' : 'Save my PayPal account with TermSheet Funding'}</button>
                <p className="small muted mt-2">Opens PayPal. Nothing is charged today. Judges: log in as <span className="mono">larkspur.termsheet@example.com</span>.</p>
                {err && <p className="small mt-1" style={{ color: 'var(--bad)' }}>{err}</p>}
              </div>
            )}
            {saved && (
              <div className="mt-8 pt-8 border-t space-y-2">
                <div className="callout-good">PayPal account saved with TermSheet Funding. Charged today: <b>$0.00</b>.</div>
                <div className="callout-good">Ridgeline paid {usd(data.payout.amount_cents)} by PayPal Payout · batch <span className="mono">{data.payout.batch_id}</span> · {data.payout.status}</div>
                <p className="small muted">Due in {out.term_days} days. Follow it on the café phone and the funder ledger.</p>
              </div>
            )}
          </section>
        )}

        {(saved || q.get('saved')) && <MoneyStrip s={s} />}

        {started && (
          <section className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
            <div className="card-flat p-4 sm:p-8 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="t-h3">How the AI analyst worked</h2>
                {mode === 'live'
                  ? <span className="chip chip-blue">Claude · {model} · {tools.length} tool calls{totalMs ? ` · ${(totalMs / 1000).toFixed(1)}s` : ''}</span>
                  : mode === 'fallback' ? <span className="chip chip-warn" title="The AI call failed or its budget was used up. Same live PayPal reads; plain code wrote the memo.">AI unavailable · rule-based fallback</span>
                  : mode ? <span className="chip chip-warn" title="Same live PayPal reads. Plain code wrote the memo. No AI call.">Practice mode · no AI call</span> : null}
              </div>
              <ol className="mt-4 space-y-3">
                {tools.map((t, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="chip chip-blue shrink-0">{TOOL_LABEL[t.name || ''] || t.name}</span>
                    <div className="min-w-0 flex-1">
                      <div className="small break-words" style={{ color: t.status === 'error' ? 'var(--bad)' : undefined }}>{t.summary}</div>
                      <div className="h-1 rounded-full mt-1" style={{ background: 'var(--blue-soft)' }}><div className="h-1 rounded-full" style={{ width: `${Math.max(4, ((t.ms || 0) / maxMs) * 100)}%`, background: 'var(--blue)' }} /></div>
                    </div>
                    <span className="mono muted shrink-0">{((t.ms || 0) / 1000).toFixed(1)}s</span>
                  </li>
                ))}
                {validate && <li className={validate.errors?.length ? 'callout-bad small' : 'callout-good small'}>{validate.errors?.length ? `Checks failed: ${validate.errors.join('; ')}` : '✓ Every sentence cites real evidence · within the scorecard ceiling · policy rules pass'}</li>}
                {!out && <li className="small muted animate-pulse">Reading PayPal…</li>}
              </ol>
            </div>

            <div className="card-flat p-4 sm:p-8 min-w-0">
              <h2 className="t-h3">Credit memo</h2>
              <p className="small muted">Tap a number to see the PayPal record behind each sentence.</p>
              {!out && <p className="small muted mt-3">The memo appears when the analyst finishes.</p>}
              {out && (
                <div className="mt-3 space-y-3">
                  {out.memo?.map((m: any, i: number) => <p key={i} className="rise" style={{ animationDelay: `${i * 60}ms` }}>{m.text} <Cites ids={m.evidence_ids} /></p>)}
                  {out.contradictions?.map((m: any, i: number) => <p key={'c' + i} className="callout-bad"><b>Contradiction.</b> {m.text} <Cites ids={m.evidence_ids} /></p>)}
                  {out.would_change && <p className="small muted"><b>What would change this decision:</b> {out.would_change}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {evidence.length > 0 && (
          <section className="card p-4 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Evidence the analyst read ({evidence.length})</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide sources' : `Show all ${evidence.length} sources`}</button>
            </div>
            {!showAll && <p className="small muted mt-2">{groups.map((g) => `${g.rows.length} from ${g.source.split('.')[0]}`).join(' · ')}</p>}
            {showAll && groups.map((g) => (
              <div key={g.source} className="mt-4">
                <div className="small font-semibold" style={{ color: 'var(--navy)' }}>{g.source.split('.')[0]} {/Orders API|seed/i.test(g.source) || g.rows[0].evidence_id.startsWith('txn:') || g.rows[0].evidence_id.startsWith('sales:') || g.rows[0].evidence_id.startsWith('inv:') ? <Chip kind="seeded" /> : null}</div>
                {g.source.includes('.') && <div className="small muted">{g.source.split('.').slice(1).join('.').trim()}</div>}
                <div className="mt-1 divide-y" style={{ borderColor: 'var(--line)' }}>
                  {g.rows.map((e) => (
                    <div key={e.evidence_id} id={`ev-${e.evidence_id}`} className={`grid sm:grid-cols-[2.5rem_14rem_1fr] gap-x-3 py-1.5 px-2 rounded ${hl === e.evidence_id ? 'hl' : ''}`}>
                      <span className="small font-bold" style={{ color: 'var(--blue)' }}>{evIndex.get(e.evidence_id)}</span>
                      <span className="mono muted break-all">{e.evidence_id}</span>
                      <span className="small">{e.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
