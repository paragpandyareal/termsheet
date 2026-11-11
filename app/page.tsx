'use client';
// Judge hub (PRD 14).
import Link from 'next/link';
import { useState } from 'react';
import { Nav, MoneyStrip, ClockChip, useAppState, Chip } from '@/components/money';

export default function Hub() {
  const [s, load] = useAppState();
  const [msg, setMsg] = useState('');
  const reset = async () => {
    setMsg('Resetting. This sends Ridgeline a fresh real payout for Second Shot, so it takes a few seconds…');
    const r = await fetch('/api/demo/reset', { method: 'POST' }).then((r) => r.json());
    setMsg(r.ok ? `Reset done. Second Shot order ${r.orderNo} is funded and due tomorrow.` : r.reason || 'Reset failed.');
    load();
  };
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section>
          <h1 className="text-3xl font-bold">Net 30 for Business (concept)</h1>
          <p className="muted mt-2 max-w-3xl">A café buying from a small coffee roaster asks for 30 days to pay, right inside PayPal checkout. An AI credit analyst reads the café&apos;s PayPal history and writes a memo where every sentence links to its source. The roaster is paid today by a funder, and the funder charges the café&apos;s saved PayPal account on day 30.</p>
        </section>

        <section className="grid md:grid-cols-3 gap-3">
          {[
            ['1. Approve a café', 'Larkspur Café orders $2,000 of beans, applies, and saves its PayPal account. Ridgeline is paid $1,940 by Payout.', '/shop'],
            ['2. Watch a payment fail and recover', 'Second Shot Café is already funded. Jump the clock, the charge is declined, the café explains, and the analyst offers a plan.', '/buyer/buyer_secondshot'],
            ['3. See a decline', 'Northgate Resale says it is a café but ships to a freight forwarder, and its letter contradicts its form.', '/shop?buyer=northgate'],
          ].map(([t, d, h]) => (
            <Link key={t} href={h} className="card p-4 block hover:shadow-md">
              <div className="font-bold">{t}</div>
              <p className="text-sm muted mt-1">{d}</p>
            </Link>
          ))}
        </section>

        <section className="space-y-3">
          <ClockChip s={s} onChange={load} />
          <MoneyStrip s={s} />
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-ghost" onClick={reset}>Reset demo</button>
            <span className="text-sm muted">{msg || 'Resets app state only. PayPal history is never deleted. Once a minute.'}</span>
          </div>
        </section>

        <section className="card p-4" style={{ borderColor: 'var(--accent)' }}>
          <div className="font-bold">What is real and what is seeded</div>
          <p className="text-sm mt-1">Every dollar on screen is a real PayPal sandbox transaction. That covers saved account approvals, charges with the buyer absent, and Payouts. The analyst&apos;s tool calls read the PayPal sandbox live. Seeded items are buyer history (created this month) <Chip kind="seeded">SEEDED</Chip>, the app clock and the test decline <Chip kind="sim">SIMULATED DECLINE</Chip>. All rates are assumptions <Chip kind="assume">ASSUMPTION</Chip>. TermSheet is a concept for a PayPal product and is not an offer of credit.</p>
        </section>

        <section className="card p-4">
          <div className="font-bold">Sandbox login for the PayPal popup</div>
          <p className="text-sm mt-1">Larkspur Café: <span className="mono">larkspur.termsheet@example.com</span>. The password is in the project README.</p>
          <p className="text-xs muted mt-2">Free hosting sleeps. The first load can take up to a minute.</p>
        </section>
      </main>
    </>
  );
}
