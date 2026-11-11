'use client';
// Funder ledger (PRD 4). Receivables, limits, charge attempts with PayPal IDs and debug IDs, payouts, webhook log.
import { Nav, MoneyStrip, ClockChip, Chip, Status, REASON_TEXT, useAppState, usd } from '@/components/money';

export default function Funder() {
  const [s, load] = useAppState(3000);
  if (!s) return <><Nav /><main className="p-6 muted">Loading…</main></>;
  const name = (id: string) => s.buyers.find((b: any) => b.id === id)?.display_name || id;
  const T = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left muted">{head.map((h) => <th key={h} className="pr-3 py-1 font-semibold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="align-top border-t" style={{ borderColor: 'var(--line)' }}>{r.map((c, j) => <td key={j} className="pr-3 py-1.5">{c}</td>)}</tr>)}</tbody></table>
      {!rows.length && <p className="text-sm muted py-2">Nothing yet.</p>}</div>
  );
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div><div className="t-label" style={{ color: 'var(--blue)' }}>Funder ledger · sandbox stand in for a PayPal credit unit</div><h1 className="t-h2 mt-1">TermSheet Funding</h1><p className="muted mt-1">Every row is a real PayPal sandbox call, with its PayPal ID and debug ID.</p></div>
        <ClockChip s={s} onChange={load} />
        <MoneyStrip s={s} />
        <section className="card-flat p-4 sm:p-8 min-w-0 overflow-hidden"><div className="t-h3 mb-4">Credit lines</div>
          <T head={['Buyer', 'Status', 'Limit', 'Saved PayPal account']} rows={s.lines.map((l: any) => [name(l.buyer_id), <Status s={l.status} />, usd(l.limit_cents), l.vault_id ? 'Yes' : 'No'])} /></section>
        <section className="card-flat p-4 sm:p-8 min-w-0 overflow-hidden"><div className="t-h3 mb-4">Receivables</div>
          <T head={['Order', 'Buyer', 'Principal', 'Due', 'Status']} rows={s.receivables.map((r: any) => [r.order_no, name(r.buyer_id), usd(r.principal_cents), r.due, <Status s={r.status} />])} /></section>
        <section className="card-flat p-4 sm:p-8 min-w-0 overflow-hidden"><div className="t-h3 mb-4">Charge attempts (buyer absent)</div>
          <T head={['Result', 'Mode', 'PayPal order', 'Capture', 'Debug ID']} rows={s.attempts.map((a: any) => [
            a.status === 'COMPLETED' ? <Status s="COMPLETED" /> : <span className="chip chip-sim">Declined · {a.error_name}</span>, a.mode.startsWith('MOCK') ? <Chip kind="sim" /> : 'Real charge',
            <span className="mono break-all">{a.paypal_order_id || '(none created)'}</span>, <span className="mono">{a.capture_id || ''}</span>, <span className="mono">{a.debug_id}</span>])} /></section>
        <section className="card-flat p-4 sm:p-8 min-w-0 overflow-hidden"><div className="t-h3 mb-4">Payouts to Ridgeline</div>
          <T head={['Order', 'Amount', 'Fee', 'Batch', 'Status', 'Debug ID']} rows={s.payouts.map((p: any) => [p.order_no, usd(p.amount_cents), <>{usd(p.fee_cents)} <Chip kind="assume">3% fee</Chip></>, <span className="mono">{p.batch_id}</span>, <Status s={p.status} />, <span className="mono">{p.debug_id}</span>])} /></section>
        <section className="card-flat p-4 sm:p-8 min-w-0 overflow-hidden"><div className="t-h3 mb-4">Limit changes (plain code rules)</div>
          <T head={['When', 'From', 'To', 'Reason']} rows={s.limitChanges.map((c: any) => [new Date(c.created_at).toLocaleTimeString(), usd(c.from_cents), usd(c.to_cents), `${c.reason_code} · ${REASON_TEXT[c.reason_code] || ''}`])} /></section>
        <section className="card-flat p-4 sm:p-8 min-w-0 overflow-hidden"><div className="t-h3 mb-4">Webhook log</div>
          <T head={['App', 'Event', 'Verified']} rows={s.webhooks.map((w: any) => [w.app, w.type, w.verified ? 'Yes' : 'No'])} />
          <p className="small muted mt-2">Webhooks need the public hosted address. The ledger never waits on them; API results update state first.</p></section>
      </main>
    </>
  );
}
