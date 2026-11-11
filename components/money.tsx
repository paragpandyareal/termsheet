'use client';
// Shared money screen parts (PRD 4.1). Money strip, clock chip, honesty chips.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export const usd = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function useAppState(ms = 4000) {
  const [s, setS] = useState<any>(null);
  const load = () => fetch('/api/state', { cache: 'no-store' }).then((r) => r.json()).then(setS).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, ms); return () => clearInterval(t); }, [ms]);
  return [s, load] as const;
}

export function Chip({ kind, children }: { kind: 'seeded' | 'sim' | 'assume' | 'plain'; children: React.ReactNode }) {
  const cls = kind === 'seeded' ? 'chip chip-seeded' : kind === 'sim' ? 'chip chip-sim' : kind === 'assume' ? 'chip chip-assume' : 'chip';
  return <span className={cls}>{children}</span>;
}

function Tile({ label, cents, last, color }: { label: string; cents: number; last?: string | null; color: string }) {
  const prev = useRef(cents);
  const [flash, setFlash] = useState(false);
  useEffect(() => { if (prev.current !== cents) { setFlash(true); prev.current = cents; const t = setTimeout(() => setFlash(false), 1200); return () => clearTimeout(t); } }, [cents]);
  return (
    <div className="card p-3 min-w-0 transition-shadow" style={{ boxShadow: flash ? `0 0 0 3px ${color}` : undefined }}>
      <div className="text-xs font-semibold muted">{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{cents >= 0 ? '+' : '−'}{usd(Math.abs(cents))}</div>
      <div className="mono muted truncate" title={last || ''}>{last ? `Last PayPal ID ${last}` : 'No PayPal movement yet'}</div>
    </div>
  );
}

export function MoneyStrip({ s }: { s: any }) {
  if (!s) return null;
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Tile label="Ridgeline Roasters (supplier)" cents={s.totals.supplier} last={s.lastId.supplier} color="#0f766e" />
        <Tile label="TermSheet Funding (funder)" cents={s.totals.funder} last={s.lastId.funder} color="#4338ca" />
        <Tile label="Café (buyer) charged" cents={s.totals.buyer} last={s.lastId.buyer} color="#b45309" />
      </div>
      <p className="text-xs muted mt-1">Gross amounts of real PayPal sandbox movements in this demo session. Sandbox fees are an artefact and are not shown.</p>
    </div>
  );
}

export function ClockChip({ s, onChange }: { s: any; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const go = async (action: string) => { setBusy(true); await fetch('/api/demo/clock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); setBusy(false); onChange(); };
  return (
    <div className="card px-3 py-2 flex flex-wrap items-center gap-2" title="Only the app date moves. Every charge is a real PayPal sandbox call.">
      <span className="text-sm font-semibold">App date {s?.today || '…'}</span>
      <Chip kind="seeded">APP CLOCK</Chip>
      <button className="btn btn-ghost text-sm" disabled={busy} onClick={() => go('day')}>+1 day</button>
      <button className="btn text-sm" disabled={busy} onClick={() => go('next')}>{busy ? 'Charging…' : 'Jump to next due date'}</button>
    </div>
  );
}

export function Nav() {
  const links = [['/', 'Judge hub'], ['/shop', 'Shop'], ['/buyer/buyer_secondshot', 'Café phone'], ['/funder', 'Funder ledger']];
  return (
    <nav className="max-w-6xl mx-auto px-4 pt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
      <span style={{ color: 'var(--accent)' }}>TermSheet</span>
      {links.map(([h, t]) => <Link key={h} href={h} className="muted hover:underline">{t}</Link>)}
    </nav>
  );
}
