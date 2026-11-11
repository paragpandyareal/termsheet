'use client';
// What Ridgeline sees (Zone A). Paid today by PayPal Payout, nothing waiting on cafés, the 3% fee, and the Payout status.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Nav, Chip, Status, usd, fmtDate, Skeleton, StoryBar } from '@/components/money';
import { Zone, CustomerZone } from '@/components/zones';
import { addDays } from '@/lib/ledger/rules';

export default function Supplier() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    const load = () => fetch('/api/supplier', { cache: 'no-store' }).then((r) => r.json()).then(setD).catch(() => {});
    load(); const t = setInterval(load, 5000); return () => clearInterval(t);
  }, []);
  const rows: any[] = (d?.rows || []).filter((r: any) => r.status !== 'FAILED' && r.status !== 'DENIED');
  const paid = rows.reduce((a, r) => a + (r.amount_cents || 0), 0);
  const fees = rows.reduce((a, r) => a + (r.fee_cents || 0), 0);

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Zone kind="C">
          <StoryBar step={1}>
            <span className="small">Ridgeline’s side of story 1. Approve Larkspur at <Link href="/shop" className="underline font-bold">Checkout</Link> and its Payout appears here.</span>
          </StoryBar>
        </Zone>

        <CustomerZone initial="desktop" url="termsheet.example/supplier" title="What the supplier sees" note="Marisol at Ridgeline Roasters: what she is paid, and when.">
          <div className="p-4 @lg:p-8 space-y-6">
            <div>
              <div className="t-label" style={{ color: 'var(--blue)' }}>Ridgeline Roasters · Net 30 orders</div>
              <h1 className="t-h2 mt-1">You are paid today. TermSheet waits 30 days.</h1>
            </div>
            {!d ? <Skeleton rows={3} /> : (
              <>
                <div className="grid @xl:grid-cols-3 gap-3">
                  <div className="card-flat p-4"><div className="t-label">Paid to you by PayPal Payout</div><div className="text-[32px] font-extrabold num mt-1" style={{ color: 'var(--good)' }}>{usd(paid)}</div><div className="small muted">On {rows.length} Net 30 order{rows.length === 1 ? '' : 's'}</div></div>
                  <div className="card-flat p-4"><div className="t-label">Waiting on cafés</div><div className="text-[32px] font-extrabold num mt-1" style={{ color: 'var(--navy)' }}>$0</div><div className="small muted">TermSheet Funding collects from the café. A late café is not your problem.</div></div>
                  <div className="card-flat p-4"><div className="t-label">Fees</div><div className="text-[32px] font-extrabold num mt-1" style={{ color: 'var(--navy)' }}>{usd(fees)}</div><div className="small muted">3% of each order, taken from the Payout. <Chip kind="assume">3% fee is an assumption</Chip></div></div>
                </div>

                <section>
                  <h2 className="t-h3">Orders</h2>
                  {!rows.length && <p className="small muted mt-2">No Net 30 orders yet. When a café is approved and saves its PayPal account, you are paid here the same day.</p>}
                  <ul className="mt-3 space-y-3">
                    {rows.map((r) => (
                      <li key={r.id} className="card p-4 rise">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="font-bold" style={{ color: 'var(--navy)' }}>{r.buyer} <span className="mono muted">{r.order_no}</span></div>
                          <Status s={r.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div><div className="t-label">Order</div><div className="font-bold num">{usd(r.order_cents)}</div></div>
                          <div><div className="t-label">Fee 3%</div><div className="font-bold num">−{usd(r.fee_cents || 0)}</div></div>
                          <div><div className="t-label">Paid to you</div><div className="font-bold num" style={{ color: 'var(--good)' }}>{usd(r.amount_cents || 0)}</div></div>
                        </div>
                        <div className="small muted mt-3">
                          {r.due ? `Funded ${fmtDate(addDays(r.due, -30))}. The café pays TermSheet on ${fmtDate(r.due)}.` : ''} Payout batch <span className="mono break-all">{r.batch_id}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
        </CustomerZone>
      </main>
    </>
  );
}
