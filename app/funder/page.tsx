'use client';
// PayPal credit team console (PRD 4). A real product surface for the funder: lines, receivables, charge attempts with
// PayPal IDs and debug IDs, payouts, limit changes and the webhook log. Demo controls sit in Zone C below.
import { Nav, Chip, Status, REASON_TEXT, useAppState, usd, fmtDate, Skeleton, DemoControls, MoneyStrip } from '@/components/money';
import { Zone } from '@/components/zones';

export default function Funder() {
  const [s] = useAppState(3000);
  if (!s) return <><Nav /><main className="max-w-6xl mx-auto px-4 py-6 space-y-4"><Skeleton rows={3} /><Skeleton rows={5} /></main></>;
  const name = (id: string) => s.buyers.find((b: any) => b.id === id)?.display_name || id;
  const T = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
    <div className="overflow-x-auto" role="region" aria-label={head.join(', ')} tabIndex={0}><table className="w-full text-sm"><thead><tr className="text-left muted">{head.map((h) => <th key={h} className="pr-3 py-1 font-semibold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="align-top border-t" style={{ borderColor: 'var(--line)' }}>{r.map((c, j) => <td key={j} className="pr-3 py-1.5">{c}</td>)}</tr>)}</tbody></table>
      {!rows.length && <p className="text-sm muted py-2">Nothing yet.</p>}</div>
  );
  const Card = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="card-flat p-4 sm:p-6 min-w-0 overflow-hidden"><h2 className="t-h3 mb-4">{t}</h2>{children}</section>;
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Zone kind="B" note="TermSheet Funding, a sandbox stand-in for a PayPal credit unit. Every row is a real PayPal sandbox call, with its PayPal ID and debug ID.">
          <div className="space-y-4">
            <h1 className="t-h2">Credit team console</h1>
            <MoneyStrip s={s} />
            <Card t="Credit lines"><T head={['Buyer', 'Status', 'Limit', 'Saved PayPal account']} rows={s.lines.map((l: any) => [name(l.buyer_id), <Status s={l.status} />, usd(l.limit_cents), l.saved ? 'Yes' : 'No'])} /></Card>
            <Card t="Receivables"><T head={['Order', 'Buyer', 'Principal', 'Due', 'Status']} rows={s.receivables.map((r: any) => [r.order_no, name(r.buyer_id), usd(r.principal_cents), fmtDate(r.due), <Status s={r.status} />])} /></Card>
            <Card t="Charge attempts (buyer absent)"><T head={['Result', 'Mode', 'PayPal order', 'Capture', 'Debug ID']} rows={s.attempts.map((a: any) => [
              a.status === 'COMPLETED' ? <Status s="COMPLETED" /> : <><Status s="FAILED" /><span className="mono muted ml-1">{a.error_name}</span></>, a.mode.startsWith('MOCK') ? <Chip kind="sim" /> : 'Real charge',
              <span className="mono break-all">{a.paypal_order_id || '(none created)'}</span>, <span className="mono">{a.capture_id || ''}</span>, <span className="mono">{a.debug_id}</span>])} /></Card>
            <Card t="Payouts to Ridgeline"><T head={['Order', 'Amount', 'Fee', 'Batch', 'Status', 'Debug ID']} rows={s.payouts.map((p: any) => [p.order_no, usd(p.amount_cents), <>{usd(p.fee_cents)} <Chip kind="assume">3% fee</Chip></>, <span className="mono">{p.batch_id}</span>, <Status s={p.status} />, <span className="mono">{p.debug_id}</span>])} /></Card>
            <Card t="Limit changes (plain code rules)"><T head={['When', 'From', 'To', 'Reason']} rows={s.limitChanges.map((c: any) => [new Date(c.created_at).toLocaleTimeString(), usd(c.from_cents), usd(c.to_cents), <>{REASON_TEXT[c.reason_code] || 'Limit change'}<span className="mono muted ml-1">{c.reason_code}</span></>])} /></Card>
            <Card t="Webhook log"><T head={['App', 'Event', 'Verified']} rows={s.webhooks.map((w: any) => [w.app, w.type, w.verified ? 'Yes' : 'No'])} />
              <p className="small muted mt-2">Webhooks need the public hosted address. The ledger never waits on them; API results update state first.</p></Card>
          </div>
        </Zone>
        <Zone kind="C">
          <DemoControls open strip={false} />
        </Zone>
      </main>
    </>
  );
}
