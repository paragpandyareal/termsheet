'use client';
// Home. Answers three questions in order: what is the problem, how does TermSheet solve it, what does PayPal earn.
// Then the three stories, the honesty box and, in Zone C, the demo controls.
import Link from 'next/link';
import { Nav, Chip, DemoControls } from '@/components/money';
import { Zone } from '@/components/zones';

const ANSWERS = [
  { k: 'The problem', big: '56%', d: 'of US small businesses are owed money on unpaid invoices. Suppliers like Marisol can’t wait 30 days, so they ask for cash up front and lose cafés.' },
  { k: 'How TermSheet solves it', big: '$1,940', d: 'paid to the roaster today by PayPal Payout. The café gets 30 days. An AI credit analyst decides who qualifies and cites a PayPal record for every sentence.' },
  { k: 'What PayPal earns', big: '$60', d: 'fee on a $2,000 order, about $21 after costs and expected losses. And wholesale orders now paid by bank transfer move onto PayPal.' },
];

const FLOW = [
  { when: 'Day 0', who: 'Café orders $2,000 of beans', note: 'Picks Net 30 under the PayPal buttons on the roaster’s checkout', amt: '$2,000' },
  { when: 'Day 0', who: 'Roaster is paid today', note: 'TermSheet Funding sends a PayPal Payout, less the 3% fee', amt: '$1,940' },
  { when: 'Day 30', who: 'Café pays', note: 'Charged to the PayPal account it saved, with a reminder 3 days before', amt: '$2,000' },
];

const SIDES = [
  { who: 'The roaster', gets: 'Paid today, not in 30 days. Offers terms without chasing invoices or carrying the risk of a café that closes.' },
  { who: 'The café', gets: '30 days to sell the coffee before paying for it. No fees, no interest. If a payment fails, a fair plan instead of a collections letter.' },
  { who: 'PayPal', gets: 'A fee on every order, wholesale volume moving onto PayPal, and more cafés selling through PayPal.' },
];

const TRUST = [
  { mark: 'var(--good-mark)', t: 'Real PayPal sandbox money', d: 'Every dollar on screen is a real sandbox Payout, saved account or charge, with its PayPal ID.' },
  { mark: 'var(--info-mark)', t: 'Every AI sentence is sourced', d: 'Every sentence of the credit memo must cite a record a PayPal tool actually returned. Plain code checks it.' },
  { mark: 'var(--purple-mark)', t: 'The AI can only tighten', d: 'A plain scorecard sets the ceiling. The AI may lower a limit, decline or refer to a person. It can never raise a limit, and it never moves money.' },
];

// docs/DEVPOST.md per-order economics. All rates are assumptions.
const ECON: [string, string, string][] = [
  ['Fee paid by the roaster', '3.0%', '+$60'],
  ['Cost of funds, 30 days at 6% a year', '0.5%', '−$10'],
  ['Collection cost', '0.3%', '−$6'],
  ['Servicing', '0.15%', '−$3'],
  ['Expected loss', '1.0%', '−$20'],
];

const SectionHead = ({ n, id, t, sub }: { n: number; id: string; t: string; sub?: string }) => (
  <div className="flex items-start gap-3">
    <span className="step">{n}</span>
    <div><h2 className="t-h2" id={id}>{t}</h2>{sub && <p className="muted mt-1 max-w-2xl">{sub}</p>}</div>
  </div>
);

export default function Home() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* The pitch and the three answers, all on the first screen. */}
        <section className="hero-band p-4 sm:p-8" aria-labelledby="pitch">
          <div className="t-label on-navy-muted">Net 30 for Business · inside PayPal checkout</div>
          <h1 className="t-h1 on-navy mt-2 max-w-4xl" id="pitch">The roaster is paid today. The café pays in 30 days. PayPal earns the fee.</h1>
          <ol className="grid md:grid-cols-3 gap-3 mt-8">
            {ANSWERS.map((a, i) => (
              <li key={a.k} className="rounded-2xl p-4 sm:p-6 step-in" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', animationDelay: `${100 + i * 200}ms` }}>
                <div className="t-label on-navy-muted">{i + 1} · {a.k}</div>
                <div className="text-[40px] font-extrabold num on-navy leading-none mt-3">{a.big}</div>
                <p className="small on-navy-muted mt-2">{a.d}</p>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link href="/shop" className="btn btn-white btn-lg">Watch it work, 5 minutes →</Link>
            <span className="small on-navy-muted">Concept demo in the PayPal sandbox. Fee, costs and loss rate are assumptions.</span>
          </div>
        </section>

        {/* 1. The problem. */}
        <section aria-labelledby="problem" className="space-y-4">
          <SectionHead n={1} id="problem" t="The problem" />
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
            <div className="card-flat p-4 sm:p-8">
              <p className="text-[20px] font-bold" style={{ color: 'var(--navy)' }}>Marisol runs Ridgeline Roasters, a six-person coffee roastery that sells to cafés.</p>
              <p className="mt-3">Her café customers want 30 days to pay, because big distributors give them that. Marisol can’t wait 30 days for her money, and she has no way to tell which new café will pay. So she asks for payment up front, and she loses accounts.</p>
              <p className="mt-3 muted">Orders like these, one small business buying from another, are mostly paid by bank transfer or cheque against an invoice, outside PayPal.</p>
            </div>
            <div className="card-flat p-4 sm:p-8">
              <div className="text-[48px] font-extrabold num leading-none" style={{ color: 'var(--navy)' }}>56%</div>
              <p className="mt-2">of US small businesses say they are owed money on unpaid invoices, <b>$17,500</b> on average among those owed.</p>
              <p className="small muted mt-2">Intuit QuickBooks Small Business Late Payments Report 2025, survey of 2,487 businesses.</p>
            </div>
          </div>
        </section>

        {/* 2. How TermSheet solves it. */}
        <section aria-labelledby="solution" className="space-y-4">
          <SectionHead n={2} id="solution" t="How TermSheet solves it" sub="A Net 30 option under the PayPal buttons on the roaster’s own checkout. A funder pays the roaster today and collects from the café on day 30." />
          <ol className="card-flat grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x overflow-hidden">
            {FLOW.map((s, i) => (
              <li key={i} className="p-4 sm:p-6">
                <div className="mono muted">{s.when}</div>
                <div className="text-[32px] font-extrabold num mt-1" style={{ color: i === 1 ? 'var(--good)' : 'var(--navy)' }}>{s.amt}</div>
                <div className="font-bold mt-1" style={{ color: 'var(--navy)' }}>{s.who}</div>
                <div className="small muted mt-1">{s.note}</div>
              </li>
            ))}
          </ol>
          <div className="grid md:grid-cols-3 gap-4">
            {SIDES.map((x) => (
              <div key={x.who} className="p-4 sm:p-6 rounded-2xl" style={{ background: 'var(--subtle)' }}>
                <div className="t-label">What {x.who.toLowerCase()} gets</div>
                <p className="mt-2">{x.gets}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TRUST.map((x) => (
              <div key={x.t} className="card-flat p-4 sm:p-6">
                <div className="flex items-center gap-3"><span className="mark" style={{ background: x.mark }} /><h3 className="t-h3">{x.t}</h3></div>
                <p className="small muted mt-2">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. What's in it for PayPal. */}
        <section aria-labelledby="paypal" className="space-y-4">
          <SectionHead n={3} id="paypal" t="What’s in it for PayPal" sub="A new revenue line PayPal does not have today: credit for the business that is buying, at the supplier’s checkout." />
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4 items-start">
            <div className="card-flat p-4 sm:p-6 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="t-h3">Per $2,000 order</h3><Chip kind="assume">All rates are assumptions</Chip></div>
              <table className="w-full mt-3 text-[15px]">
                <thead><tr className="text-left small muted"><th className="py-1 font-semibold">Line</th><th className="py-1 pl-3 font-semibold text-right">Rate</th><th className="py-1 pl-3 font-semibold text-right">Amount</th></tr></thead>
                <tbody>
                  {ECON.map(([l, r, a]) => <tr key={l} className="border-t"><td className="py-2 pr-2">{l}</td><td className="py-2 pl-3 text-right num muted">{r}</td><td className="py-2 pl-3 text-right num font-semibold" style={{ color: a.startsWith('+') ? 'var(--good)' : undefined }}>{a}</td></tr>)}
                  <tr className="border-t-2" style={{ borderColor: 'var(--navy)' }}><td className="py-2 font-extrabold" style={{ color: 'var(--navy)' }}>Contribution</td><td className="py-2 text-right num font-extrabold" style={{ color: 'var(--navy)' }}>1.05%</td><td className="py-2 text-right num font-extrabold" style={{ color: 'var(--good)' }}>+$21</td></tr>
                </tbody>
              </table>
              <p className="small mt-4 callout-blue"><b>At scale:</b> every $1B of wholesale orders on Net 30 earns about <b>$30M in fees</b> and <b>$10.5M in contribution</b> at these assumptions.</p>
              <p className="small muted mt-3">The 3% fee replaces PayPal’s normal processing fee on that order; it is not charged on top. Collection cost assumes the café pays from its PayPal balance or bank account. Break-even is a loss rate of about 2%, so small limits that grow with on-time payment, and an AI that can only tighten, matter.</p>
            </div>
            <div className="space-y-4 min-w-0">
              {[
                ['Wholesale volume moves onto PayPal', 'Orders between small businesses are mostly paid by bank transfer or cheque. Net 30 at checkout gives them a reason to go through PayPal.'],
                ['A flywheel of new merchants', 'The analyst reads the café’s own PayPal sales. Cafés that sell through PayPal score higher and get bigger limits, so every café that wants terms has a reason to become a PayPal merchant.'],
                ['Lending only PayPal can do safely', 'PayPal sees both sides: the roaster’s trade history with the café, and the café’s own sales landing in PayPal. Repayment comes from that same account.'],
                ['The AI protects the margin', 'The expected-loss and collection lines are where a bad decision costs money. The AI catches what the rules miss, such as a letter that contradicts the form, before any money goes out.'],
              ].map(([t, d]) => (
                <div key={t} className="p-4 sm:p-6 rounded-2xl border-l-4" style={{ borderColor: 'var(--blue)', background: 'var(--subtle)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--navy)' }}>{t}</h3>
                  <p className="small mt-1">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* See it work. */}
        <section aria-labelledby="stories" className="space-y-4">
          <SectionHead n={4} id="stories" t="See it work" sub="Three stories, about 5 minutes. Every page shows what the customer sees, what PayPal’s credit team sees, and the demo controls, each clearly labelled." />
          <ol className="grid md:grid-cols-3 gap-4">
            {[
              { n: 1, accent: 'blue', t: 'A café gets 30 days', d: 'Larkspur orders $2,000 of beans, the AI approves it in seconds, and the roaster is paid today.', h: '/shop', time: '2 min', start: true },
              { n: 2, accent: 'orange', t: 'A missed payment gets fixed', d: 'The day 30 charge is declined, the café explains, and the AI checks the story against real sales.', h: '/buyer/buyer_secondshot', time: '2 min' },
              { n: 3, accent: 'purple', t: 'AI catches what rules miss', d: 'The rules alone would approve Northgate. The AI spots a letter that contradicts the form and stops it for a human check.', h: '/shop?buyer=northgate', time: '1 min' },
            ].map((x) => (
              <li key={x.n}>
                <Link href={x.h} className={`card lift p-4 sm:p-6 flex flex-col h-full accent-${x.accent}`}>
                  <div className="flex items-center gap-3">
                    <span className={`step step-${x.accent}`}>{x.n}</span>
                    {x.start ? <span className="chip chip-blue">Start here</span> : null}
                    <span className="small muted ml-auto">{x.time}</span>
                  </div>
                  <h3 className="t-h3 mt-4">{x.t}</h3>
                  <p className="small muted mt-2 flex-1">{x.d}</p>
                  <span className="small font-bold mt-4" style={{ color: 'var(--blue)' }}>Open story {x.n} →</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <Zone kind="C">
          <div className="space-y-4">
            <section className="grid md:grid-cols-[1.4fr_1fr] gap-4 small">
              <div className="p-4 sm:p-6 rounded-2xl border bg-white">
                <h2 className="t-label">What is real and what is seeded</h2>
                <p className="mt-2 muted">Every dollar on screen is a real PayPal sandbox transaction: saved account approvals, charges with the buyer absent, and Payouts. The analyst&apos;s tool calls read the PayPal sandbox live. Seeded items are buyer history created this month, the app clock and the test decline. All rates are assumptions. Not an offer of credit.</p>
                <div className="flex flex-wrap gap-2 mt-3"><Chip kind="seeded" /><Chip kind="clock" /><Chip kind="sim" /><Chip kind="assume" /></div>
              </div>
              <div className="p-4 sm:p-6 rounded-2xl border bg-white">
                <h2 className="t-label">Judge login for the PayPal popup</h2>
                <p className="mt-2 muted">Larkspur Café · sandbox test account with fake money</p>
                <p className="mono mt-1 text-[14px]">larkspur.termsheet@example.com</p>
                <p className="mono text-[14px]">larkspurtermsheet</p>
                <p className="muted mt-2">This is one shared demo. If a story looks half done, open Demo controls below and press Reset.</p>
              </div>
            </section>
            <DemoControls />
          </div>
        </Zone>
      </main>
    </>
  );
}
