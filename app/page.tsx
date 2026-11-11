'use client';
// Home (PRD 14). One story, in order: problem, the money picture, three stories, why trust it, honesty and login.
// One primary button on the page. Live controls live in the collapsed drawer at the bottom.
import Link from 'next/link';
import { Nav, Chip, DemoControls } from '@/components/money';

const FLOW = [
  { when: 'Day 0', who: 'Café orders', amt: '$2,000', note: 'Picks Net 30 at checkout', tone: '#FFFFFF' },
  { when: 'Day 0', who: 'Roaster paid today', amt: '$1,940', note: 'PayPal Payout, less a 3% fee', tone: '#8FF0B0' },
  { when: 'Day 30', who: 'Funder collects', amt: '$2,000', note: 'From the café’s saved PayPal', tone: '#B9D6FF' },
];

const STORIES = [
  { n: 1, t: 'A café gets 30 days', d: 'Larkspur orders $2,000 of beans, the AI approves it in seconds, and the roaster is paid today.', h: '/shop', time: '2 min', start: true },
  { n: 2, t: 'A missed payment gets fixed', d: 'The day 30 charge is declined, the café explains, and the AI checks the story against real sales.', h: '/buyer/buyer_secondshot', time: '2 min' },
  { n: 3, t: 'AI catches what rules miss', d: 'The rules alone would approve Northgate. The AI spots a letter that contradicts the form and stops it for a human check.', h: '/shop?buyer=northgate', time: '1 min' },
];

const TRUST = [
  { t: 'Real PayPal sandbox money', d: 'Every dollar on screen is a real sandbox Payout, saved account or charge, with its PayPal ID.' },
  { t: 'Every AI sentence has a receipt', d: 'Each line of the credit memo links to the PayPal record it came from. Code rejects anything uncited.' },
  { t: 'The AI can only tighten', d: 'A plain scorecard sets the ceiling. The AI may lower a limit or decline, never raise it.' },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* 1 and 2. Problem first, then the money picture as the hero image. */}
        <section className="hero-band p-4 sm:p-8">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
            <div>
              <h1 className="t-h1 on-navy">Marisol&apos;s café customers want 30 days to pay. Her six-person roastery can&apos;t wait that long.</h1>
              <p className="mt-4 text-[17px] on-navy-muted max-w-xl">TermSheet pays the roaster today and the café pays in 30 days, inside PayPal checkout. An AI credit analyst decides who qualifies and shows the PayPal record behind every sentence.</p>
              <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 max-w-xl" style={{ background: 'rgba(255,255,255,.1)' }}>
                <span className="text-[32px] font-extrabold num leading-none on-navy">56%</span>
                <span className="small on-navy-muted">of US small businesses are owed money on unpaid invoices, <b className="on-navy">$17,500</b> on average. <span className="block text-[12px] mt-1">Intuit QuickBooks Small Business Late Payments Report 2025, survey of 2,487 businesses.</span></span>
              </div>
              <Link href="/shop" className="btn btn-white btn-lg mt-8">Watch it work, 5 minutes →</Link>
            </div>

            <figure aria-label="One order, three parties" className="rounded-2xl p-4 sm:p-8" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)' }}>
              <figcaption className="t-label on-navy-muted">One order, three parties</figcaption>
              <ol className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {FLOW.map((s, i) => (
                  <li key={i} className="step-in flex sm:flex-col lg:flex-row items-center sm:items-start lg:items-center gap-3" style={{ animationDelay: `${150 + i * 350}ms` }}>
                    <span className="mono on-navy-muted shrink-0 w-12">{s.when}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold on-navy">{s.who}</div>
                      <div className="small on-navy-muted">{s.note}</div>
                    </div>
                    <span className="text-[28px] font-extrabold num" style={{ color: s.tone }}>{s.amt}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 pt-4 small on-navy-muted" style={{ borderTop: '1px solid rgba(255,255,255,.18)' }}>Every amount is a real PayPal sandbox transaction.</p>
            </figure>
          </div>
        </section>

        {/* 3. Three stories as a numbered path. Equal cards. */}
        <section aria-labelledby="stories">
          <div className="t-label" id="stories">Three stories · about 5 minutes</div>
          <ol className="grid md:grid-cols-3 gap-4 mt-3">
            {STORIES.map((x) => (
              <li key={x.n}>
                <Link href={x.h} className="card lift p-4 sm:p-8 flex flex-col h-full" style={x.start ? { borderColor: 'var(--blue)', borderWidth: 2 } : undefined}>
                  <div className="flex items-center gap-3">
                    <span className="step">{x.n}</span>
                    {x.start ? <span className="chip chip-blue">Start here</span> : null}
                    <span className="small muted ml-auto">{x.time}</span>
                  </div>
                  <h2 className="t-h3 mt-4">{x.t}</h2>
                  <p className="small muted mt-2 flex-1">{x.d}</p>
                  <span className="small font-bold mt-4" style={{ color: 'var(--blue)' }}>Open story {x.n} →</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Why trust it. */}
        <section aria-labelledby="trust">
          <div className="t-label" id="trust">Why trust it</div>
          <div className="grid md:grid-cols-3 gap-4 mt-3">
            {TRUST.map((x) => (
              <div key={x.t} className="card-flat p-4 sm:p-8">
                <div className="t-h3">{x.t}</div>
                <p className="small muted mt-2">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Quiet footer: honesty box and judge login, then the demo controls drawer. */}
        <section className="grid md:grid-cols-[1.4fr_1fr] gap-4 small">
          <div className="p-4 sm:p-8 rounded-2xl border">
            <div className="t-label">What is real and what is seeded</div>
            <p className="mt-2 muted">Every dollar on screen is a real PayPal sandbox transaction: saved account approvals, charges with the buyer absent, and Payouts. The analyst&apos;s tool calls read the PayPal sandbox live. Seeded items are buyer history created this month, the app clock and the test decline. All rates are assumptions. Not an offer of credit.</p>
            <div className="flex flex-wrap gap-2 mt-3"><Chip kind="seeded" /><Chip kind="clock" /><Chip kind="sim" /><Chip kind="assume" /></div>
          </div>
          <div className="p-4 sm:p-8 rounded-2xl border">
            <div className="t-label">Judge login for the PayPal popup</div>
            <p className="mt-2 muted">Larkspur Café · sandbox test account with fake money</p>
            <p className="mono mt-1 text-[14px]">larkspur.termsheet@example.com</p>
            <p className="mono text-[14px]">larkspurtermsheet</p>
            <p className="muted mt-2">Free hosting sleeps, so the first load can take up to a minute.</p>
          </div>
        </section>

        <DemoControls />
      </main>
    </>
  );
}
