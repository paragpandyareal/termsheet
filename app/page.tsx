'use client';
// Judge hub (PRD 14).
import Link from 'next/link';
import { useState } from 'react';
import { Nav, MoneyStrip, ClockChip, useAppState, Chip } from '@/components/money';

const STORIES = [
  { n: 1, t: 'Approve a café', d: 'Larkspur Café orders $2,000 of beans and asks for Net 30. The AI analyst reads its PayPal history, approves, and the café saves its PayPal account. Ridgeline is paid $1,940 today.', h: '/shop', cta: 'Open checkout' },
  { n: 2, t: 'A payment fails, then recovers', d: 'Second Shot Café owes $2,000. Jump to the due date: the charge is declined, the café explains, and the AI checks the story against real sales and offers a plan.', h: '/buyer/buyer_secondshot', cta: 'Open café phone' },
  { n: 3, t: 'Catch a bad application', d: 'Northgate Resale says it is a café, ships to a freight forwarder, and its letter contradicts its form and tries to trick the AI.', h: '/shop?buyer=northgate', cta: 'See the decline' },
];

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
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="rounded-3xl p-6 sm:p-10 text-white" style={{ background: 'linear-gradient(135deg, #001C64 0%, #003087 55%, #0070E0 100%)' }}>
          <div className="small font-semibold opacity-80">PayPal AI Hackathon · concept</div>
          <h1 className="text-3xl sm:text-[40px] font-extrabold leading-tight mt-1" style={{ color: '#fff' }}>Net 30 for Business, inside PayPal checkout</h1>
          <p className="mt-3 max-w-3xl opacity-90">Small suppliers lose café customers because they can&apos;t offer 30 days to pay. TermSheet lets a café ask for Net 30 at checkout. An AI credit analyst reads the café&apos;s PayPal history and writes a memo where every sentence links to its source. The supplier is paid today, and the café&apos;s saved PayPal account is charged on day 30.</p>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {STORIES.map((x) => (
            <div key={x.n} className="card p-5 flex flex-col">
              <div className="flex items-center gap-3"><span className="step">{x.n}</span><h2 className="text-lg font-bold">{x.t}</h2></div>
              <p className="small muted mt-2 flex-1">{x.d}</p>
              <Link href={x.h} className="btn btn-sm mt-4 self-start">{x.cta} →</Link>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <ClockChip s={s} onChange={load} />
          <MoneyStrip s={s} />
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-ghost btn-sm" onClick={reset}>Reset demo</button>
            <span className="small muted">{msg || 'Resets app state only. PayPal history is never deleted. Once a minute.'}</span>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-bold">What is real and what is seeded</h2>
            <p className="small mt-2">Every dollar on screen is a real PayPal sandbox transaction: saved account approvals, charges with the buyer absent, and Payouts. The analyst&apos;s tool calls read the PayPal sandbox live. Seeded items are buyer history created this month, the app clock and the test decline. All rates are assumptions. TermSheet is a concept for a PayPal product and is not an offer of credit.</p>
            <div className="flex flex-wrap gap-2 mt-3"><Chip kind="seeded" /><Chip kind="clock" /><Chip kind="sim" /><Chip kind="assume" /></div>
          </div>
          <div className="card p-5">
            <h2 className="font-bold">Sandbox login for the PayPal popup</h2>
            <p className="small mt-2">Larkspur Café: <span className="mono">larkspur.termsheet@example.com</span>. The password is in the project README.</p>
            <p className="small muted mt-2">Free hosting sleeps, so the first load can take up to a minute.</p>
          </div>
        </section>
      </main>
    </>
  );
}
