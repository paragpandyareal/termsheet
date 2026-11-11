'use client';
// Funder ledger (PRD 4). Receivables, limits, charge attempts with PayPal IDs and debug IDs, payouts, webhook log.
import { Nav, MoneyStrip, ClockChip, Chip, useAppState, usd } from '@/components/money';

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
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold">TermSheet Funding <span className="text-sm muted font-normal">(sandbox stand in for a PayPal credit unit)</span></h1>
        <ClockChip s={s} onChange={load} />
        <MoneyStrip s={s} />
        <section className="card p-4"><div className="font-bold mb-2">Credit lines</div>
          <T head={['Buyer', 'Status', 'Limit', 'Saved PayPal account']} rows={s.lines.map((l: any) => [name(l.buyer_id), l.status, usd(l.limit_cents), l.vault_id ? 'Yes' : 'No'])} /></section>
        <section className="card p-4"><div className="font-bold mb-2">Receivables</div>
          <T head={['Order', 'Buyer', 'Principal', 'Due', 'Status']} rows={s.receivables.map((r: any) => [r.order_no, name(r.buyer_id), usd(r.principal_cents), r.due, r.status])} /></section>
        <section className="card p-4"><div className="font-bold mb-2">Charge attempts (buyer absent)</div>
          <T head={['Result', 'Mode', 'PayPal order', 'Capture', 'Debug ID']} rows={s.attempts.map((a: any) => [
            a.status === 'COMPLETED' ? '✅ Completed' : `❌ ${a.error_name}`, a.mode.startsWith('MOCK') ? <Chip kind="sim">SIMULATED DECLINE</Chip> : 'Real',
            <span className="mono break-all">{a.paypal_order_id || '(none created)'}</span>, <span className="mono">{a.capture_id || ''}</span>, <span className="mono">{a.debug_id}</span>])} /></section>
        <section className="card p-4"><div className="font-bold mb-2">Payouts to Ridgeline</div>
          <T head={['Order', 'Amount', 'Fee', 'Batch', 'Status', 'Debug ID']} rows={s.payouts.map((p: any) => [p.order_no, usd(p.amount_cents), <>{usd(p.fee_cents)} <Chip kind="assume">3%</Chip></>, <span className="mono">{p.batch_id}</span>, p.status, <span className="mono">{p.debug_id}</span>])} /></section>
        <section className="card p-4"><div className="font-bold mb-2">Limit changes (plain code rules)</div>
          <T head={['When', 'From', 'To', 'Reason']} rows={s.limitChanges.map((c: any) => [new Date(c.created_at).toLocaleTimeString(), usd(c.from_cents), usd(c.to_cents), c.reason_code])} /></section>
        <section className="card p-4"><div className="font-bold mb-2">Webhook log</div>
          <T head={['App', 'Event', 'Verified']} rows={s.webhooks.map((w: any) => [w.app, w.type, w.verified ? 'Yes' : 'No'])} />
          <p className="text-xs muted">Webhooks need the public hosted address. The ledger never waits on them; API results update state first.</p></section>
      </main>
    </>
  );
}
