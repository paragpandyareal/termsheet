'use client';
// Judge hub (PRD 14). Hero: the money flow in one picture.
import Link from 'next/link';
import { useState } from 'react';
import { Nav, MoneyStrip, ClockChip, useAppState, Chip } from '@/components/money';

const STORIES = [
  { n: 1, t: 'Approve a café', d: 'Larkspur orders $2,000 of beans and asks for Net 30. The AI analyst reads its PayPal history and approves. Ridgeline is paid $1,940 today.', h: '/shop', cta: 'Open checkout', time: '2 min' },
  { n: 2, t: 'A payment fails, then recovers', d: 'Jump to the due date. The charge is declined, the café explains in its own words, and the AI checks the story against real sales before offering a plan.', h: '/buyer/buyer_secondshot', cta: 'Open café phone', time: '2 min' },
  { n: 3, t: 'The AI catches what the rules miss', d: 'Northgate has 8 paid orders, so the rules alone would approve it. The AI notices it ships to a freight forwarder, its letter contradicts its form, and the letter tries to instruct the AI.', h: '/shop?buyer=northgate', cta: 'See the AI step in', time: '1 min' },
];

function Flow() {
  const steps = [
    { when: 'Day 0', who: 'Café orders', amt: '$2,000', note: 'Net 30 at checkout', tone: 'rgba(255,255,255,.7)' },
    { when: 'Day 0', who: 'Ridgeline is paid', amt: '$1,940', note: 'PayPal Payout, 3% fee', tone: '#7CE3A1' },
    { when: 'Day 30', who: 'Funder collects', amt: '$2,000', note: 'Saved PayPal, café absent', tone: '#9CC8FF' },
  ];
  return (
    <div className="rounded-2xl p-4 sm:p-8" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)' }}>
      <div className="t-label" style={{ color: 'rgba(255,255,255,.7)' }}>One order, three parties</div>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-4 rise" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="mono shrink-0 w-12" style={{ color: 'rgba(255,255,255,.6)' }}>{s.when}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold">{s.who}</div>
              <div className="small" style={{ color: 'rgba(255,255,255,.7)' }}>{s.note}</div>
            </div>
            <span className="text-2xl font-extrabold num" style={{ color: s.tone }}>{s.amt}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 pt-4 small" style={{ borderTop: '1px solid rgba(255,255,255,.16)', color: 'rgba(255,255,255,.75)' }}>Every amount is a real PayPal sandbox transaction.</div>
    </div>
  );
}

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
        <section className="hero-band p-8 sm:p-8 grid lg:grid-cols-[1.25fr_1fr] gap-8 items-center">
          <div>
            <span className="chip chip-onnavy">PayPal AI Hackathon · concept</span>
            <h1 className="t-h1 mt-4" style={{ color: '#fff' }}>Net 30 for small business, right inside PayPal checkout.</h1>
            <p className="mt-4 text-[17px] max-w-xl" style={{ color: 'rgba(255,255,255,.85)' }}>Cafés want 30 days to pay. Small roasters can&apos;t carry that. TermSheet pays the roaster today, and an AI credit analyst decides who gets terms, citing every PayPal record it used.</p>
            <p className="mt-4 small max-w-xl rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.9)' }}><b style={{ color: '#fff' }}>Why PayPal.</b> Other net terms providers only see the invoice. PayPal also sees the buyer&apos;s real sales and payment history, and already lends to sellers based on their PayPal sales. TermSheet points that same data at business checkout, so wholesale orders that are paid by bank transfer today have a reason to use PayPal.</p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/shop" className="btn btn-white btn-lg">Start the demo →</Link>
              <a href="#stories" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)' }}>Three stories</a>
            </div>
          </div>
          <Flow />
        </section>

        <section id="stories" className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
          <Link href={STORIES[0].h} className="card lift p-8 flex flex-col">
            <div className="flex items-center gap-3"><span className="step">1</span><span className="t-label">Start here · {STORIES[0].time}</span></div>
            <h2 className="t-h2 mt-4">{STORIES[0].t}</h2>
            <p className="muted mt-2 mb-8 max-w-lg">{STORIES[0].d}</p>
            <span className="btn mt-auto self-start">{STORIES[0].cta} →</span>
          </Link>
          <div className="grid gap-4">
            {STORIES.slice(1).map((x) => (
              <Link key={x.n} href={x.h} className="card lift p-4 sm:p-8 flex gap-4">
                <span className="step">{x.n}</span>
                <div className="min-w-0">
                  <div className="t-h3" style={{ color: 'var(--navy)' }}>{x.t}</div>
                  <p className="small muted mt-1">{x.d}</p>
                  <span className="small font-bold mt-2 inline-block" style={{ color: 'var(--blue)' }}>{x.cta} → <span className="muted font-normal">· {x.time}</span></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><div className="t-label">Live sandbox ledger</div><h2 className="t-h3 mt-1">Money moved in this demo</h2></div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="small muted">{msg || 'Reset restores app state only. Once a minute.'}</span>
              <button className="btn btn-ghost btn-sm" onClick={reset}>Reset demo</button>
            </div>
          </div>
          <MoneyStrip s={s} />
          <ClockChip s={s} onChange={load} />
        </section>

        <section className="grid md:grid-cols-[1.4fr_1fr] gap-4">
          <div className="card-flat p-8">
            <div className="t-label">Honesty box</div>
            <h2 className="t-h3 mt-1">What is real and what is seeded</h2>
            <p className="small mt-3">Every dollar on screen is a real PayPal sandbox transaction: saved account approvals, charges with the buyer absent, and Payouts. The analyst&apos;s tool calls read the PayPal sandbox live. Seeded items are buyer history created this month, the app clock and the test decline. All rates are assumptions. TermSheet is a concept for a PayPal product and is not an offer of credit.</p>
            <div className="flex flex-wrap gap-2 mt-4"><Chip kind="seeded" /><Chip kind="clock" /><Chip kind="sim" /><Chip kind="assume" /></div>
          </div>
          <div className="card-flat p-8">
            <div className="t-label">For judges</div>
            <h2 className="t-h3 mt-1">PayPal sandbox login</h2>
            <p className="small mt-3">Larkspur Café</p>
            <p className="mono mt-1 text-[14px]">larkspur.termsheet@example.com</p>
            <p className="mono mt-1 text-[14px]">larkspurtermsheet</p>
            <p className="small muted mt-3">A PayPal sandbox test account with fake money. Free hosting sleeps, so the first load can take up to a minute.</p>
          </div>
        </section>
      </main>
    </>
  );
}
