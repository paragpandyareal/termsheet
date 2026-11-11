'use client';
// Buyer phone view (PRD 4). Limit, open orders, due dates, message thread, plan offer with Accept.
import { use, useEffect, useRef, useState } from 'react';
import { Nav, ClockChip, Chip, usd } from '@/components/money';

export default function Buyer({ params }: { params: Promise<{ buyerId: string }> }) {
  const { buyerId } = use(params);
  const [v, setV] = useState<any>(null);
  const [text, setText] = useState('Espresso machine died, can pay half Friday.');
  const [busy, setBusy] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);
  const msgCount = useRef(0);
  useEffect(() => { const n = v?.messages?.length || 0; if (n !== msgCount.current && threadRef.current) { threadRef.current.scrollTop = threadRef.current.scrollHeight; msgCount.current = n; } });
  const load = () => fetch(`/api/buyer/${buyerId}`, { cache: 'no-store' }).then((r) => r.json()).then(setV);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [buyerId]);

  const send = async () => { setBusy('send'); await fetch(`/api/buyer/${buyerId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) }); setText(''); setBusy(''); load(); };
  const retry = async () => { setBusy('send'); await fetch(`/api/buyer/${buyerId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ retry: true }) }); setBusy(''); load(); };
  const accept = async (id: string) => { setBusy('accept'); await fetch(`/api/plan/${id}/accept`, { method: 'POST' }); setBusy(''); load(); };

  if (!v) return <><Nav /><main className="p-6 muted">Loading…</main></>;
  const rcvs = v.receivables.filter((r: any) => r.buyer_id === buyerId);
  const ins = v.instalments.filter((i: any) => rcvs.some((r: any) => r.id === i.receivable_id));
  const open = rcvs.filter((r: any) => r.status !== 'PAID').reduce((a: number, r: any) => a + r.principal_cents - ins.filter((i: any) => i.receivable_id === r.id && i.status === 'PAID').reduce((x: number, i: any) => x + i.amount_cents, 0), 0);
  const plan = v.plans.find((p: any) => p.status === 'PROPOSED');
  const pastDue = rcvs.some((r: any) => r.status === 'PAST_DUE');
  const attempts = v.attempts.filter((a: any) => ins.some((i: any) => i.id === a.instalment_id));

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        <div className="mx-auto w-full max-w-[380px] rounded-[40px] p-3" style={{ background: '#0B1020', boxShadow: '0 24px 48px rgba(0,28,100,.25)' }}>
          <div className="rounded-[32px] overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div className="hero-band rounded-none p-4 pt-8">
              <div className="t-label" style={{ color: 'rgba(255,255,255,.7)' }}>TermSheet · Net 30</div>
              <div className="t-h3" style={{ color: '#fff' }}>{v.buyer?.display_name}</div>
              <div className="flex justify-between mt-2 text-sm">
                <span>Limit {usd(v.line?.limit_cents || 0)}</span>
                <span>{v.line?.status === 'FROZEN' ? '❄ Frozen' : v.line?.status === 'ACTIVE' ? 'Active' : 'No line yet'}</span>
              </div>
              <div className="mt-3"><div className="small" style={{ color: 'rgba(255,255,255,.7)' }}>You owe</div><div className="text-[36px] font-extrabold num leading-none">{usd(open)}</div></div>
            </div>
            <div className="p-3 space-y-2">
              {ins.filter((i: any) => i.status === 'SCHEDULED').map((i: any) => (
                <div key={i.id} className="card px-3 py-2 text-sm flex justify-between"><span>Due {i.due}</span><span className="font-semibold">{usd(i.amount_cents)}</span></div>
              ))}
              <div ref={threadRef} className="space-y-2 max-h-[360px] overflow-y-auto">
                {v.messages.map((m: any) => (
                  <div key={m.id} className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${m.sender === 'BUYER' ? 'ml-auto' : ''}`} style={{ background: m.sender === 'BUYER' ? 'var(--accent)' : 'var(--card)', color: m.sender === 'BUYER' ? 'white' : 'var(--ink)', border: m.sender === 'BUYER' ? 'none' : '1px solid var(--line)' }}>
                    <span className="block text-[11px] opacity-70">{m.sender === 'SYSTEM' ? 'Automatic · ' : ''}{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>{m.body}
                  </div>
                ))}
              </div>
              {plan && (
                <div className="card p-3 text-sm" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
                  <div className="font-bold">Payment plan offer</div>
                  {plan.proposal_json.instalments.map((p: any, k: number) => <div key={k}>{k === 0 ? 'Today' : `Day ${p.due_in_days_from_original} after the original due date`}: {usd(p.amount_cents)}</div>)}
                  <div className="text-xs muted mt-1">No fees, no interest. Policy check: {plan.policy_check_json?.ok ? 'passed' : 'failed'}.</div>
                  <button className="btn w-full justify-center mt-2" disabled={!!busy} onClick={() => accept(plan.id)}>{busy === 'accept' ? 'Charging…' : 'Accept'}</button>
                </div>
              )}
              {pastDue && !plan && (
                <div className="flex gap-2">
                  <input className="card flex-1 px-3 py-2 text-sm min-w-0" value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" />
                  <button className="btn" disabled={!!busy || !text.trim()} onClick={send}>{busy === 'send' ? '…' : 'Send'}</button>
                </div>
              )}
              {busy === 'send' || (pastDue && v.messages.at(-1)?.sender === 'BUYER') ? (<div className="small muted">TermSheet&apos;s analyst is checking your message against your recent PayPal sales…{Date.now() - Date.parse(v.messages.at(-1)?.created_at || 0) > 60000 && <button className="btn btn-ghost btn-sm mt-2" disabled={!!busy} onClick={retry}>Taking too long? Try again</button>}</div>) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <div><div className="t-label" style={{ color: 'var(--blue)' }}>Café phone · Second Shot Café</div><h1 className="t-h2 mt-1">When a payment fails</h1><p className="muted mt-1 max-w-xl">Jump to the due date. The real charge is declined (sandbox test), the café replies in its own words, and the AI checks the story against the café&apos;s PayPal sales before offering a plan.</p></div>
          <ClockChip s={v} onChange={load} />
          {(() => { const p = v.plans[0]; if (!p) return null; const pj = p.proposal_json || {}; const sc = pj.story_check || {}; const md = pj.mode?.mode; return (
            <div className="card p-5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Why this plan</h2>
                <span className={md === 'live' ? 'chip chip-blue' : 'chip chip-warn'}>{md === 'live' ? 'Claude · ' + (pj.mode?.model || '') : md === 'fallback' ? 'AI unavailable · rule-based fallback' : 'Practice mode · no AI call'}</span></div>
              {sc.claim && <p className="small mt-2"><b>What the café said it can do:</b> {sc.claim}</p>}
              <p className={'mt-2 ' + (sc.consistent ? 'callout-good' : 'callout-bad')}><b>{sc.consistent ? 'Story checks out.' : 'Story does not fully check out.'}</b> {sc.text}</p>
              {(pj.memo || []).map((m: any, i: number) => <p key={i} className="small mt-2">{m.text}</p>)}
              <p className="small muted mt-2">Plan checked by plain code against the policy: at most 2 parts, first part at least 25% today, done within 15 days, no fees. {p.policy_check_json?.ok ? '✓ Passed' : '✗ Failed'}</p>
            </div>); })()}
          <div className="card-flat p-4 sm:p-8 min-w-0">
            <div className="font-bold mb-2">Charges on this account</div>
            {!attempts.length && <p className="text-sm muted">No charges yet. Jump to the next due date to run the collection job.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {attempts.map((a: any) => (
                    <tr key={a.id} className="align-top">
                      <td className="pr-2 py-1">{a.status === 'COMPLETED' ? '✅' : '❌'}</td>
                      <td className="pr-2 py-1">{a.status === 'COMPLETED' ? 'Charged' : a.error_name}{a.mode.startsWith('MOCK') && <> <Chip kind="sim">Simulated decline (sandbox negative testing)</Chip></>}</td>
                      <td className="pr-2 py-1 mono break-all">{a.capture_id || ''}</td>
                      <td className="py-1 mono">debug {a.debug_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
