'use client';
// Ridgeline wholesale checkout (PRD 4, route /shop). Hero: the Net 30 card. PayPal buttons from the supplier app sit beside it.
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Nav, Chip, usd, StoryBar } from '@/components/money';

const CATALOG: Record<string, { sku: string; name: string; detail: string; qty: number; unit: number }[]> = {
  larkspur: [
    { sku: 'RR-HOUSE-5', name: 'House espresso blend', detail: '5 lb bag · medium roast', qty: 20, unit: 6500 },
    { sku: 'RR-SO-ETH-5', name: 'Single origin, washed', detail: '5 lb bag · light roast', qty: 8, unit: 8750 },
  ],
  northgate: [
    { sku: 'RR-HOUSE-5', name: 'House espresso blend', detail: '5 lb bag · medium roast', qty: 30, unit: 6500 },
    { sku: 'RR-SO-ETH-5', name: 'Single origin, washed', detail: '5 lb bag · light roast', qty: 5, unit: 8750 },
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
        style: { layout: 'vertical', shape: 'pill', label: 'paypal', height: 44 },
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

  const net30 = async () => { setBusy(true); const o = await newOrder(); router.push(`/apply/${o.id}`); };

  return (
    <>
      <Nav />
      <StoryBar step={buyer === 'northgate' ? 3 : 1} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="t-label" style={{ color: 'var(--blue)' }}>Ridgeline Roasters · wholesale</div>
            <h1 className="t-h2 mt-1">Checkout</h1>
          </div>
          <label className="small font-bold flex items-center gap-2">
            <span className="muted">Judge mode · buying as</span>
            <select className="field w-auto mt-0" value={buyer} onChange={(e) => setBuyer(e.target.value)}>
              {BUYERS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </label>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 mt-8 items-start">
          <section className="card-flat p-4 sm:p-8">
            <div className="t-label">Your order</div>
            <ul className="mt-4 divide-y">
              {items.map((i) => (
                <li key={i.sku} className="flex justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="font-bold" style={{ color: 'var(--navy)' }}>{i.name}</div>
                    <div className="small muted">{i.detail} · {i.qty} × {usd(i.unit)}</div>
                  </div>
                  <div className="font-bold num whitespace-nowrap">{usd(i.qty * i.unit)}</div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-end pt-4 mt-2 border-t">
              <span className="font-bold">Total</span><span className="t-h2 num">{usd(total)}</span>
            </div>
            <p className="small muted mt-2">Ships to {buyer === 'northgate' ? 'Pier 40 Freight Forwarding, Bayonne NJ' : 'Larkspur Café, Main St'}.</p>
            <div className="mt-8">
              <div className="t-label">Pay now</div>
              <div ref={btnRef} className="mt-3" style={{ minHeight: 52 }} />
              {!supplierClientId && <p className="small muted">Supplier PayPal app not configured.</p>}
              {note && <p className="small mt-2">{note}</p>}
            </div>
          </section>

          <section className="card-hero overflow-hidden" style={{ borderColor: 'var(--blue)' }}>
            <div className="hero-band rounded-none p-4 sm:p-8">
              <div className="flex flex-wrap items-center gap-2"><span className="chip chip-onnavy">New</span><span className="chip chip-onnavy">Decision in under a minute</span></div>
              <h2 className="t-h1 mt-4 on-navy">Pay in 30 days.<br />Ridgeline is paid today.</h2>
              <p className="mt-3 on-navy-muted">Net 30 for Business. Take the beans now and pay {usd(total)} on day 30 from your saved PayPal account.</p>
            </div>
            <div className="p-4 sm:p-8">
              <ul className="space-y-3">
                {[
                  ['No cost to the café', 'Ridgeline pays a 3% fee.'],
                  ['AI credit check, with receipts', 'Every sentence of the decision links to the PayPal record behind it.'],
                  ['Nothing charged today', 'You save your PayPal account. The charge runs on the due date, with a reminder 3 days before.'],
                ].map(([a, b]) => (
                  <li key={a} className="flex gap-3"><span className="chip chip-good shrink-0 self-start mt-1">Yes</span><div><div className="font-bold" style={{ color: 'var(--navy)' }}>{a}</div><div className="small muted">{b}</div></div></li>
                ))}
              </ul>
              <button className="btn btn-lg w-full mt-8" disabled={busy} onClick={net30}>{busy ? 'Starting…' : `Apply for Net 30 on ${usd(total)}`}</button>
              <div className="flex flex-wrap gap-2 mt-3"><Chip kind="assume">3% fee is an assumption</Chip></div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
