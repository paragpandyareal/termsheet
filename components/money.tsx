'use client';
// Shared money screen parts (PRD 4.1). Money strip, clock chip, honesty chips, nav, status pills.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const usd = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  ACTIVE: ['chip chip-good', 'Active'], PAID: ['chip chip-good', 'Paid'], COMPLETED: ['chip chip-good', 'Completed'], SUCCESS: ['chip chip-good', 'Paid out'],
  OPEN: ['chip chip-blue', 'Open'], RESTRUCTURED: ['chip chip-warn', 'On a plan'], PENDING: ['chip chip-warn', 'Pending'], PROCESSING: ['chip chip-warn', 'Processing'],
  FROZEN: ['chip chip-sim', 'Frozen'], PAST_DUE: ['chip chip-sim', 'Past due'], FAILED: ['chip chip-sim', 'Failed'], NONE: ['chip', 'No line'],
};
export function Status({ s }: { s: string }) {
  const [cls, label] = STATUS[s] || ['chip', s];
  return <span className={cls}>{label}</span>;
}
export const REASON_TEXT: Record<string, string> = { RP08: 'Missed payment, limit reduced', ON_TIME: 'Paid on time, limit raised' };

function Tile({ label, cents, last, note, big }: { label: string; cents: number; last?: string | null; note: string; big?: boolean }) {
  const prev = useRef(cents);
  const [flash, setFlash] = useState(false);
  useEffect(() => { if (prev.current !== cents) { setFlash(true); prev.current = cents; const t = setTimeout(() => setFlash(false), 1400); return () => clearTimeout(t); } }, [cents]);
  const color = cents > 0 ? 'var(--good)' : cents < 0 ? 'var(--navy)' : 'var(--muted)';
  return (
    <div className="p-4 sm:p-8 min-w-0 transition-colors" style={{ background: flash ? 'var(--blue-soft)' : undefined }}>
      <div className="t-label">{label}</div>
      <div className={(big ? 't-hero' : 'text-[32px] font-extrabold num') + ' mt-2'} style={{ color }}>{cents > 0 ? '+' : cents < 0 ? '−' : ''}{usd(Math.abs(cents))}</div>
      <div className="small muted mt-1">{note}</div>
      <div className="mono muted truncate mt-2" title={last || ''}>{last ? `PayPal ID ${last}` : 'No PayPal movement yet'}</div>
    </div>
  );
}

export function MoneyStrip({ s }: { s: any }) {
  if (!s) return null;
  return (
    <div>
      <div className="card grid sm:grid-cols-[1.3fr_1fr_1fr] divide-y sm:divide-y-0 sm:divide-x overflow-hidden" style={{ borderColor: 'var(--line)' }}>
        <Tile big label="Ridgeline · supplier" cents={s.totals.supplier} last={s.lastId.supplier} note="Paid today by PayPal Payout" />
        <Tile label="TermSheet · funder" cents={s.totals.funder} last={s.lastId.funder} note="Repayments collected" />
        <Tile label="Café · buyer" cents={s.totals.buyer} last={s.lastId.buyer} note="Charged to saved PayPal" />
      </div>
      <p className="small muted mt-2">Gross amounts. When a repayment lands, the café and the funder show the same capture ID, because one capture moves money between them.</p>
    </div>
  );
}

export function ClockChip({ s, onChange }: { s: any; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const go = async (action: string) => { setBusy(true); await fetch('/api/demo/clock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); setBusy(false); onChange(); };
  return (
    <div className="card-flat px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="min-w-0">
        <div className="font-semibold" style={{ color: 'var(--navy)' }}>App date {s?.today || '…'} <Chip kind="clock" /></div>
        <div className="small muted">Only the app date moves. Every charge is a real PayPal sandbox call.</div>
      </div>
      <div className="flex gap-2 ml-auto">
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => go('day')}>+1 day</button>
        <button className="btn btn-sm" disabled={busy} onClick={() => go('next')}>{busy ? 'Charging…' : 'Jump to next due date'}</button>
      </div>
    </div>
  );
}

export function Nav() {
  const path = usePathname();
  const links = [['/', 'Judge hub'], ['/shop', 'Checkout'], ['/buyer/buyer_secondshot', 'Café phone'], ['/funder', 'Funder ledger']];
  return (
    <header className="bg-white border-b" style={{ borderColor: 'var(--line)' }}>
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="font-extrabold text-lg" style={{ color: 'var(--navy)' }}>Term<span style={{ color: 'var(--blue)' }}>Sheet</span></Link>
        {links.map(([h, t]) => {
          const active = h === '/' ? path === '/' : path.startsWith(h.split('/').slice(0, 2).join('/'));
          return <Link key={h} href={h} className="text-[15px] font-semibold h-14 inline-flex items-center border-b-2" style={{ color: active ? 'var(--blue)' : 'var(--muted)', borderColor: active ? 'var(--blue)' : 'transparent' }}>{t}</Link>;
        })}
      </nav>
    </header>
  );
}
