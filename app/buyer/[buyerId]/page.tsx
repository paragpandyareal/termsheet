'use client';
// Café view (PRD 4), in three zones.
//  A: the café's own TermSheet app. What it owes and when, the message thread, the plan offer and Accept.
//  B: PayPal's credit team. Why the AI offered this plan, the policy check, every charge with its PayPal IDs.
//  C: demo controls. Story bar, app clock, the already-played notice.
import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Nav, ClockChip, Chip, usd, fmtDate, StoryBar, Skeleton, Status } from '@/components/money';
import { Zone, CustomerZone } from '@/components/zones';
import { addDays } from '@/lib/ledger/rules';

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

  const [playedHere, setPlayedHere] = useState(false);
  const send = async () => { setBusy('send'); const r = await fetch(`/api/buyer/${buyerId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) }); if (r.status === 429) alert((await r.json()).reason); else setText(''); setBusy(''); load(); };
  const retry = async () => { setBusy('send'); await fetch(`/api/buyer/${buyerId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ retry: true }) }); setBusy(''); load(); };
  const accept = async (id: string) => { setPlayedHere(true); setBusy('accept'); await fetch(`/api/plan/${id}/accept`, { method: 'POST' }); setBusy(''); load(); };

  if (!v) return <><Nav /><main className="max-w-6xl mx-auto px-4 py-6 space-y-6"><Skeleton rows={2} /><Skeleton rows={8} /></main></>;
  const rcvs = v.receivables.filter((r: any) => r.buyer_id === buyerId);
  const ins = v.instalments.filter((i: any) => rcvs.some((r: any) => r.id === i.receivable_id));
  const open = rcvs.filter((r: any) => r.status !== 'PAID').reduce((a: number, r: any) => a + r.principal_cents - ins.filter((i: any) => i.receivable_id === r.id && i.status === 'PAID').reduce((x: number, i: any) => x + i.amount_cents, 0), 0);
  const plan = v.plans.find((p: any) => p.status === 'PROPOSED');
  const pastDue = rcvs.some((r: any) => r.status === 'PAST_DUE');
  const attempts = v.attempts.filter((a: any) => ins.some((i: any) => i.id === a.instalment_id));
  const thinking = busy === 'send' || (pastDue && v.messages.at(-1)?.sender === 'BUYER');
  const p0 = v.plans[0];

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Zone kind="C">
          <div className="space-y-3">
            <StoryBar step={2} done={rcvs.some((r: any) => r.status === 'RESTRUCTURED' || r.status === 'PAID') && attempts.some((a: any) => a.status === 'COMPLETED')} />
            <ClockChip s={v} onChange={load} />
            {!playedHere && attempts.some((a: any) => a.status === 'COMPLETED') && (
              <p className="callout-good small">This story has already been played in the shared demo. To see the decline and recovery from the start, open <b>Demo controls</b> on the <Link href="/" className="underline">home page</Link> and press <b>Reset demo</b>.</p>
            )}
          </div>
        </Zone>

        <CustomerZone initial="phone" url="termsheet.example/account" note="Second Shot Café’s own TermSheet account. What it owes, when, and the conversation when a payment fails.">
          <div className="grid @3xl:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="hero-band rounded-none p-4 pt-6 @3xl:p-8">
                <div className="t-label" style={{ color: 'rgba(255,255,255,.75)' }}>TermSheet · Net 30</div>
                <h1 className="t-h3" style={{ color: '#fff' }}>{v.buyer?.display_name}</h1>
                <div className="flex justify-between mt-2 text-sm on-navy-muted">
                  <span>Limit {usd(v.line?.limit_cents || 0)}</span>
                  <span>{v.line?.status === 'FROZEN' ? '❄ Frozen' : v.line?.status === 'ACTIVE' ? 'Active' : 'No line yet'}</span>
                </div>
                <div className="mt-3"><div className="small on-navy-muted">You owe</div><div className="text-[36px] font-extrabold num leading-none">{usd(open)}</div></div>
              </div>
              <div className="p-3 @3xl:p-6 space-y-2">
                {rcvs.filter((r: any) => r.status === 'PAST_DUE').map((r: any) => (
                  <div key={r.id} className="callout-bad text-sm">
                    <div className="font-semibold">Past due since {fmtDate(r.due)}</div>
                    <div className="text-xs">Ridgeline order {r.order_no} · ordered {fmtDate(addDays(r.due, -30))} · Net 30</div>
                  </div>
                ))}
                {ins.filter((i: any) => i.status === 'SCHEDULED').map((i: any) => {
                  const r = rcvs.find((x: any) => x.id === i.receivable_id);
                  return (
                    <div key={i.id} className="card px-3 py-2 text-sm">
                      <div className="flex justify-between"><span className="font-semibold">Due {fmtDate(i.due)}</span><span className="font-semibold">{usd(i.amount_cents)}</span></div>
                      {r && <div className="text-xs muted">Ridgeline order {r.order_no} · ordered {fmtDate(addDays(r.due, -30))} · Net 30</div>}
                    </div>
                  );
                })}
                {plan && (
                  <div className="card p-3 text-sm" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
                    <div className="font-bold">Payment plan offer</div>
                    {plan.proposal_json.instalments.map((p: any, k: number) => <div key={k}>{k === 0 ? 'Today' : `Day ${p.due_in_days_from_original} after the original due date`}: {usd(p.amount_cents)}</div>)}
                    <div className="text-xs muted mt-1">No fees, no interest.</div>
                    <button className="btn w-full justify-center mt-2" disabled={!!busy} onClick={() => accept(plan.id)}>{busy === 'accept' ? 'Charging…' : 'Accept'}</button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 @3xl:p-6 @3xl:border-l space-y-2">
              <div className="t-label hidden @3xl:block">Messages</div>
              <div ref={threadRef} className="space-y-2 max-h-[360px] @3xl:max-h-[440px] overflow-y-auto" aria-live="polite" role="region" aria-label="Messages" tabIndex={0}>
                {!v.messages.length && <p className="small muted">No messages yet.</p>}
                {v.messages.map((m: any) => (
                  <div key={m.id} className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${m.sender === 'BUYER' ? 'ml-auto' : ''}`} style={{ background: m.sender === 'BUYER' ? 'var(--accent)' : 'var(--card)', color: m.sender === 'BUYER' ? 'white' : 'var(--ink)', border: m.sender === 'BUYER' ? 'none' : '1px solid var(--line)' }}>
                    <span className={`block text-[11px] ${m.sender === 'BUYER' ? '' : 'muted'}`}>{m.sender === 'SYSTEM' ? 'Automatic · ' : ''}{/* Time only: the app clock moves the date, so a real calendar date here would contradict it. */}{new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>{m.body}
                  </div>
                ))}
              </div>
              {pastDue && !plan && (
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor="reply">Reply to TermSheet</label>
                  <input id="reply" className="field mt-0 flex-1 min-w-0 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" />
                  <button className="btn" disabled={!!busy || !text.trim()} onClick={send}>{busy === 'send' ? '…' : 'Send'}</button>
                </div>
              )}
              {thinking ? (<div className="small muted" role="status">TermSheet is checking your message against your recent PayPal sales…{Date.now() - Date.parse(v.messages.at(-1)?.created_at || 0) > 60000 && <button className="btn btn-ghost btn-sm mt-2" disabled={!!busy} onClick={retry}>Taking too long? Try again</button>}</div>) : null}
            </div>
          </div>
        </CustomerZone>

        <Zone kind="B">
          <div className="space-y-4">
            {p0 ? (() => { const pj = p0.proposal_json || {}; const sc = pj.story_check || {}; const md = pj.mode?.mode; return (
              <section className="card-flat p-4 sm:p-6 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="t-h3">Why the AI offered this plan</h2>
                  <span className={md === 'live' ? 'chip chip-blue' : 'chip chip-warn'}>{md === 'live' ? 'Claude · ' + (pj.mode?.model || '') : md === 'fallback' ? (String(pj.mode?.model || '').includes('limit') ? 'AI hourly limit reached · rule-based fallback' : 'AI unavailable · rule-based fallback') : 'Practice mode · no AI call'}</span></div>
                {sc.claim && <p className="small mt-2"><b>What the café said it can do:</b> {sc.claim}</p>}
                <p className={'mt-2 ' + (sc.consistent ? 'callout-good' : 'callout-bad')}><b>{sc.consistent ? 'Story checks out.' : 'Story does not fully check out.'}</b> {sc.text}</p>
                {(pj.memo || []).map((m: any, i: number) => <p key={i} className="small mt-2">{m.text}</p>)}
                <p className="small muted mt-2">Plan checked by plain code against the policy: at most 2 parts, first part at least 25% today, done within 15 days, no fees. {p0.policy_check_json?.ok ? <Status s="OK" /> : <Status s="FAILED" label="Failed" />}</p>
              </section>); })() : (
              <p className="small muted">When a charge fails and the café replies, the AI’s check of the café’s story against its PayPal sales, and the plan it proposes, appear here.</p>
            )}
            <section className="card-flat p-4 sm:p-6 min-w-0">
              <h2 className="t-h3 mb-2">Charges on this account</h2>
              {!attempts.length && <p className="text-sm muted">No charges yet. Use <b>Jump to next due date</b> in the demo controls above to run the collection job.</p>}
              <div className="overflow-x-auto" role="region" aria-label="Charges on this account" tabIndex={0}>
                <table className="w-full text-sm">
                  {attempts.length > 0 && <thead><tr className="text-left muted"><th className="pr-2 py-1 font-semibold">Result</th><th className="pr-2 py-1 font-semibold">What happened</th><th className="pr-2 py-1 font-semibold">Capture ID</th><th className="py-1 font-semibold">Debug ID</th></tr></thead>}
                  <tbody>
                    {attempts.map((a: any) => (
                      <tr key={a.id} className="align-top border-t">
                        <td className="pr-2 py-1"><Status s={a.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED'} /></td>
                        <td className="pr-2 py-1">{a.status === 'COMPLETED' ? 'Charged with the café absent' : <>Card or account declined<span className="mono muted ml-1">{a.error_name}</span></>}{a.mode.startsWith('MOCK') && <> <Chip kind="sim">Simulated decline (sandbox negative testing)</Chip></>}</td>
                        <td className="pr-2 py-1 mono break-all">{a.capture_id || '—'}</td>
                        <td className="py-1 mono">{a.debug_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </Zone>
      </main>
    </>
  );
}
