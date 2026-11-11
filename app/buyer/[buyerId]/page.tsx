'use client';
// Buyer phone view (PRD 4). Limit, open orders, due dates, message thread, plan offer with Accept.
import { use, useEffect, useState } from 'react';
import { Nav, ClockChip, Chip, usd } from '@/components/money';

export default function Buyer({ params }: { params: Promise<{ buyerId: string }> }) {
  const { buyerId } = use(params);
  const [v, setV] = useState<any>(null);
  const [text, setText] = useState('Espresso machine died, can pay half Friday.');
  const [busy, setBusy] = useState('');
  const load = () => fetch(`/api/buyer/${buyerId}`, { cache: 'no-store' }).then((r) => r.json()).then(setV);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [buyerId]);

  const send = async () => { setBusy('send'); await fetch(`/api/buyer/${buyerId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) }); setText(''); setBusy(''); load(); };
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
      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[380px_1fr] gap-6">
        <div className="mx-auto w-full max-w-[380px] rounded-[32px] p-3" style={{ background: '#111' }}>
          <div className="rounded-[24px] overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div className="p-4" style={{ background: 'var(--accent)', color: 'white' }}>
              <div className="text-xs opacity-80">TermSheet Funding · Net 30 for Business (concept)</div>
              <div className="text-lg font-bold">{v.buyer?.display_name}</div>
              <div className="flex justify-between mt-2 text-sm">
                <span>Limit {usd(v.line?.limit_cents || 0)}</span>
                <span>{v.line?.status === 'FROZEN' ? '❄ Frozen' : v.line?.status === 'ACTIVE' ? 'Active' : 'No line yet'}</span>
              </div>
              <div className="text-sm">Owed {usd(open)}</div>
            </div>
            <div className="p-3 space-y-2">
              {ins.filter((i: any) => i.status !== 'PAID').map((i: any) => (
                <div key={i.id} className="card px-3 py-2 text-sm flex justify-between"><span>Due {i.due}</span><span className="font-semibold">{usd(i.amount_cents)}</span></div>
              ))}
              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {v.messages.map((m: any) => (
                  <div key={m.id} className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] ${m.sender === 'BUYER' ? 'ml-auto' : ''}`} style={{ background: m.sender === 'BUYER' ? 'var(--accent)' : 'var(--card)', color: m.sender === 'BUYER' ? 'white' : 'var(--ink)', border: m.sender === 'BUYER' ? 'none' : '1px solid var(--line)' }}>
                    {m.sender === 'SYSTEM' && <span className="text-xs muted block">Automatic</span>}{m.body}
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
              {busy === 'send' || (pastDue && v.messages.at(-1)?.sender === 'BUYER') ? <p className="text-xs muted">The analyst is checking your story against your recent PayPal sales…</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <ClockChip s={v} onChange={load} />
          <div className="card p-4 min-w-0">
            <div className="font-bold mb-2">Charges on this account</div>
            {!attempts.length && <p className="text-sm muted">No charges yet. Jump to the next due date to run the collection job.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {attempts.map((a: any) => (
                    <tr key={a.id} className="align-top">
                      <td className="pr-2 py-1">{a.status === 'COMPLETED' ? '✅' : '❌'}</td>
                      <td className="pr-2 py-1">{a.status === 'COMPLETED' ? 'Charged' : a.error_name}{a.mode.startsWith('MOCK') && <> <Chip kind="sim">SIMULATED DECLINE (sandbox negative testing)</Chip></>}</td>
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
