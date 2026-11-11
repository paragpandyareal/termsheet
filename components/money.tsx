'use client';
// Shared parts (PRD 4.1). Money and date formats, nav, story step bar, money strip, clock, demo controls, pills, skeletons.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// One money format: $2,000 for whole dollars, $1,150.25 otherwise.
export const usd = (c: number) => {
  const whole = Math.round(c) % 100 === 0;
  return (c < 0 ? '−$' : '$') + (Math.abs(c) / 100).toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 });
};
// One date format: 12 Nov 2026.
export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return '';
  const x = typeof d === 'string' ? new Date(d.length === 10 ? d + 'T00:00:00Z' : d) : d;
  return x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

export function useAppState(ms = 4000) {
  const [s, setS] = useState<any>(null);
  const load = () => fetch('/api/state', { cache: 'no-store' }).then((r) => r.json()).then(setS).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, ms); return () => clearInterval(t); }, [ms]);
  return [s, load] as const;
}

const CHIP: Record<string, [string, string, string]> = {
  seeded: ['chip', '◷', 'Seeded'], sim: ['chip chip-sim', '⚑', 'Simulated decline'], assume: ['chip', '≈', 'Assumption'], clock: ['chip', '◔', 'App clock'], plain: ['chip', '', ''],
};
export function Chip({ kind, children, title }: { kind: keyof typeof CHIP; children?: React.ReactNode; title?: string }) {
  const [cls, icon, label] = CHIP[kind];
  return <span className={cls} title={title}>{icon && <span aria-hidden>{icon}</span>}{children ?? label}</span>;
}

const STATUS: Record<string, [string, string]> = {
  ACTIVE: ['chip chip-good', 'Active'], PAID: ['chip chip-good', 'Paid'], COMPLETED: ['chip chip-good', 'Charged'], SUCCESS: ['chip chip-good', 'Paid out'], OK: ['chip chip-good', 'Passed'],
  OPEN: ['chip chip-blue', 'Open'], RESTRUCTURED: ['chip chip-warn', 'On a plan'], PENDING: ['chip chip-warn', 'Pending'], PROCESSING: ['chip chip-warn', 'Processing'],
  FROZEN: ['chip chip-sim', 'Frozen'], PAST_DUE: ['chip chip-sim', 'Past due'], FAILED: ['chip chip-sim', 'Declined'], NONE: ['chip', 'No line'],
};
export function Status({ s, label }: { s: string; label?: string }) {
  const [cls, l] = STATUS[s] || ['chip', s];
  return <span className={cls}>{label ?? l}</span>;
}
export const REASON_TEXT: Record<string, string> = { RP08: 'Missed payment, limit reduced', ON_TIME: 'Paid on time, limit raised' };
export const Code = ({ children }: { children: React.ReactNode }) => <span className="mono muted ml-1">{children}</span>;

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card-flat p-4 sm:p-8 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-32 rounded" style={{ background: 'var(--line-2)' }} />
      <div className="h-8 w-2/3 rounded mt-3" style={{ background: 'var(--line-2)' }} />
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-4 rounded mt-3" style={{ background: 'var(--line-2)', width: `${90 - i * 12}%` }} />)}
    </div>
  );
}

function Tile({ label, cents, last, note }: { label: string; cents: number; last?: string | null; note: string }) {
  const prev = useRef(cents);
  const [flash, setFlash] = useState(false);
  useEffect(() => { if (prev.current !== cents) { setFlash(true); prev.current = cents; const t = setTimeout(() => setFlash(false), 1400); return () => clearTimeout(t); } }, [cents]);
  const color = cents > 0 ? 'var(--good)' : cents < 0 ? 'var(--navy)' : 'var(--muted)';
  return (
    <div className="p-4 sm:p-8 min-w-0 transition-colors" style={{ background: flash ? 'var(--blue-soft)' : undefined }}>
      <div className="t-label">{label}</div>
      <div className="text-[28px] font-extrabold num mt-2" style={{ color }}>{cents > 0 ? '+' : ''}{usd(cents)}</div>
      <div className="small muted mt-1">{note}</div>
      <div className="mono muted truncate mt-2" title={last || ''}>{last ? `PayPal ID ${last}` : 'No PayPal movement yet'}</div>
    </div>
  );
}

export function MoneyStrip({ s }: { s: any }) {
  if (!s) return <Skeleton rows={2} />;
  return (
    <div>
      <div className="card grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x overflow-hidden">
        <Tile label="Ridgeline · supplier" cents={s.totals.supplier} last={s.lastId.supplier} note="Paid by PayPal Payout" />
        <Tile label="TermSheet · funder" cents={s.totals.funder} last={s.lastId.funder} note="Payouts sent, repayments collected" />
        <Tile label="Café · buyer" cents={s.totals.buyer} last={s.lastId.buyer} note="Charged to saved PayPal" />
      </div>
      <p className="small muted mt-2">Gross amounts of real PayPal sandbox movements in this demo session. When a repayment lands, the café and the funder show the same capture ID, because one capture moves money between them.</p>
    </div>
  );
}

export function ClockChip({ s, onChange }: { s: any; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const go = async (action: string) => { setBusy(true); await fetch('/api/demo/clock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); setBusy(false); onChange(); };
  return (
    <div className="card-flat px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="min-w-0">
        <div className="font-bold flex flex-wrap items-center gap-2" style={{ color: 'var(--navy)' }}>App date {fmtDate(s?.today)} <Chip kind="clock" /></div>
        <div className="small muted">Only the app date moves. Every charge is a real PayPal sandbox call.</div>
      </div>
      <div className="flex gap-2 ml-auto">
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => go('day')}>+1 day</button>
        <button className="btn btn-sm" disabled={busy} onClick={() => go('next')}>{busy ? 'Charging…' : 'Jump to next due date'}</button>
      </div>
    </div>
  );
}

export function DemoControls({ open = false }: { open?: boolean }) {
  const [s, load] = useAppState(5000);
  const [msg, setMsg] = useState('');
  const reset = async () => {
    setMsg('Resetting. This sends Ridgeline a fresh real payout for Second Shot, so it takes a few seconds…');
    const r = await fetch('/api/demo/reset', { method: 'POST' }).then((r) => r.json());
    setMsg(r.ok ? `Reset done. Second Shot order ${r.orderNo} is funded and due tomorrow.` : r.reason || 'Reset failed.');
    load();
  };
  return (
    <details className="card-flat group" open={open}>
      <summary className="cursor-pointer list-none px-4 sm:px-8 min-h-[56px] flex items-center justify-between gap-3">
        <span><span className="font-bold" style={{ color: 'var(--navy)' }}>Demo controls</span> <span className="small muted">· live sandbox ledger, app clock, reset</span></span>
        <span className="small font-bold" style={{ color: 'var(--blue)' }}><span className="group-open:hidden">Show</span><span className="hidden group-open:inline">Hide</span></span>
      </summary>
      <div className="px-4 sm:px-8 pb-8 space-y-4">
        <MoneyStrip s={s} />
        <ClockChip s={s} onChange={load} />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={reset}>Reset demo</button>
          <span className="small muted">{msg || 'This is one shared demo. If a story looks half done, someone else may be mid-run: press Reset to start clean. Restores app state only; PayPal history is never deleted.'}</span>
        </div>
      </div>
    </details>
  );
}

export function Nav() {
  const path = usePathname();
  // Short labels on phones so every link fits without scrolling.
  const links = [['/', 'Home', 'Home'], ['/shop', 'Checkout', 'Shop'], ['/buyer/buyer_secondshot', 'Café phone', 'Café'], ['/funder', 'Funder ledger', 'Ledger']];
  return (
    <header className="border-b relative" style={{ background: 'var(--subtle)' }}>
      <nav className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-1 sm:gap-8 whitespace-nowrap" aria-label="Main">
        <Link href="/" className="font-extrabold text-lg mr-1" style={{ color: 'var(--navy)' }}>Term<span style={{ color: 'var(--blue)' }}>Sheet</span></Link>
        {links.map(([h, t, short]) => {
          const active = h === '/' ? path === '/' : path.startsWith(h.split('/').slice(0, 2).join('/'));
          return <Link key={h} href={h} className="text-[15px] font-semibold h-11 px-2 sm:px-3 rounded-full inline-flex items-center" style={{ color: active ? 'var(--navy)' : 'var(--muted)', background: active ? 'var(--nav-active)' : 'transparent' }}><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{t}</span></Link>;
        })}
      </nav>
    </header>
  );
}

// Slim step bar under the nav: where the judge is in the three stories.
const STEPS = [
  { n: 1, t: 'Approve a café', h: '/shop' },
  { n: 2, t: 'Recover a payment', h: '/buyer/buyer_secondshot' },
  { n: 3, t: 'Catch a bad application', h: '/shop?buyer=northgate' },
];
export function StoryBar({ step, done }: { step: 1 | 2 | 3; done?: boolean }) {
  const next = STEPS[step];
  return (
    <div className="border-b" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto px-4 min-h-[48px] py-1 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ol className="flex items-center gap-2 sm:gap-4 overflow-x-auto whitespace-nowrap" aria-label="Demo stories">
          {STEPS.map((x) => {
            const state = x.n < step ? 'past' : x.n === step ? 'now' : 'next';
            return (
              <li key={x.n}>
                <Link href={x.h} className="inline-flex items-center gap-2 small font-bold min-h-[44px]" aria-current={state === 'now' ? 'step' : undefined}
                  style={{ color: state === 'now' ? 'var(--navy)' : 'var(--muted)' }}>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px]" style={{ background: state === 'now' ? 'var(--blue)' : state === 'past' ? 'var(--good-soft)' : 'var(--chip)', color: state === 'now' ? '#fff' : state === 'past' ? 'var(--good)' : 'var(--chip-ink)' }}>{x.n}</span>
                  <span className={state === 'now' ? '' : 'hidden sm:inline'}>{x.t}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        {done && (next ? <Link href={next.h} className="btn btn-sm ml-auto">Next story: {next.t} →</Link> : <Link href="/" className="btn btn-sm ml-auto">All three done · Home</Link>)}
      </div>
    </div>
  );
}
