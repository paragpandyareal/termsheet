'use client';
// Ridgeline wholesale checkout (PRD 4, route /shop). PayPal buttons from the supplier app, plus the Net 30 card.
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Nav, Chip, usd } from '@/components/money';

const CATALOG: Record<string, { sku: string; name: string; qty: number; unit: number }[]> = {
  larkspur: [
    { sku: 'RR-HOUSE-5', name: 'House espresso blend, 5 lb bag', qty: 20, unit: 6500 },
    { sku: 'RR-SO-ETH-5', name: 'Single origin, washed, 5 lb bag', qty: 8, unit: 8750 },
  ],
  northgate: [
    { sku: 'RR-HOUSE-5', name: 'House espresso blend, 5 lb bag', qty: 120, unit: 6500 },
    { sku: 'RR-SO-ETH-5', name: 'Single origin, washed, 5 lb bag', qty: 29, unit: 8750 },
  ],
};
const BUYERS = [{ key: 'larkspur', label: 'Larkspur Café' }, { key: 'northgate', label: 'Northgate Resale LLC' }];

export default function Shop({ supplierClientId }: { supplierClientId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [buyer, setBuyer] = useState(params.get('buyer') === 'northgate' ? 'northgate' : 'larkspur');
  const items = CATALOG[buyer];
  const total = items.reduce((a, b) => a + b.qty * b.unit, 0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const btnRef = useRef<HTMLDivElement>(null);

  const newOrder = () => fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyerKey: buyer, amountCents: total, items }) }).then((r) => r.json());

  useEffect(() => {
    if (!supplierClientId || !btnRef.current) return;
    const el = btnRef.current;
    el.innerHTML = '';
    const render = () => {
      const pp = (window as any).paypalSupplier;
      if (!pp) return;
      pp.Buttons({
        style: { layout: 'vertical', shape: 'rect', label: 'paypal' },
        createOrder: async () => { const o = await newOrder(); const r = await fetch('/api/paynow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', orderId: o.id }) }).then((r) => r.json()); return r.id; },
        onApprove: async (d: any) => { const r = await fetch('/api/paynow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'capture', paypalOrderId: d.orderID }) }).then((r) => r.json()); setNote(`Paid now. PayPal status ${r.status}, debug ${r.debugId}.`); },
        onError: () => setNote('PayPal button error. The sandbox sometimes fails to draw buttons. Reload to try again.'),
      }).render(el).catch(() => {});
    };
    if ((window as any).paypalSupplier) render();
    else if (!document.getElementById('pp-supplier')) {
      const s = document.createElement('script');
      s.id = 'pp-supplier';
      s.src = `https://www.paypal.com/sdk/js?client-id=${supplierClientId}&currency=USD&components=buttons&disable-funding=card,credit,paylater,venmo`;
      s.setAttribute('data-namespace', 'paypalSupplier');
      s.onload = render;
      document.head.appendChild(s);
    }
  }, [supplierClientId, buyer]);

  const net30 = async () => {
    setBusy(true);
    const o = await newOrder();
    router.push(`/apply/${o.id}`);
  };

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="small font-semibold" style={{ color: 'var(--blue)' }}>Ridgeline Roasters · wholesale coffee</div>
            <h1 className="text-[28px] font-bold">Checkout</h1>
          </div>
          <label className="text-sm">
            <span className="muted mr-2">Judge mode, buying as</span>
            <select className="field inline-block w-auto" value={buyer} onChange={(e) => setBuyer(e.target.value)}>
              {BUYERS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </label>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mt-4">
          <section className="card p-4 md:col-span-3">
            <div className="font-bold mb-2">Your order</div>
            {items.map((i) => (
              <div key={i.sku} className="flex justify-between gap-3 py-2 border-b" style={{ borderColor: 'var(--line)' }}>
                <div className="min-w-0"><div className="font-medium">{i.name}</div><div className="text-xs muted">{i.qty} × {usd(i.unit)}</div></div>
                <div className="font-semibold whitespace-nowrap">{usd(i.qty * i.unit)}</div>
              </div>
            ))}
            <div className="flex justify-between pt-3 text-lg font-bold"><span>Total</span><span>{usd(total)}</span></div>
            <p className="text-xs muted mt-2">Ships to {buyer === 'northgate' ? 'Pier 40 Freight Forwarding, Bayonne NJ' : 'the café'}.</p>
          </section>

          <section className="md:col-span-2 space-y-3">
            <div className="card p-4">
              <div className="font-bold mb-2" style={{ color: 'var(--navy)' }}>Pay now</div>
              <div ref={btnRef} style={{ minHeight: 50 }} />
              {!supplierClientId && <p className="text-xs muted">Supplier PayPal app not configured.</p>}
              {note && <p className="text-xs mt-2">{note}</p>}
            </div>
            <div className="flex items-center gap-3 small muted"><span className="flex-1 border-t" style={{ borderColor: 'var(--line)' }} />or pay later<span className="flex-1 border-t" style={{ borderColor: 'var(--line)' }} /></div>
            <div className="card p-5" style={{ borderColor: 'var(--blue)', borderWidth: 2 }}>
              <div className="flex flex-wrap items-center gap-2"><span className="font-bold text-lg" style={{ color: 'var(--navy)' }}>Net 30 for Business</span><span className="chip">concept</span><span className="chip chip-blue">Decision in under a minute</span></div>
              <p className="text-sm muted mt-1">Take the beans today, pay in 30 days. Ridgeline is paid now by TermSheet Funding. Decision in under a minute.</p>
              <button className="btn w-full justify-center mt-3" disabled={busy} onClick={net30}>{busy ? 'Starting…' : `Apply for Net 30 on ${usd(total)}`}</button>
              <p className="small muted mt-2">No cost to the café. Ridgeline pays a 3% fee <Chip kind="assume" /></p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
