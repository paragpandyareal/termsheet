'use client';
// The three page zones. A: what the customer sees (inside a device frame). B: what PayPal's credit team sees.
// C: demo controls for judges only. Every page uses the same three labels so product and scaffolding never mix.
import { useEffect, useState } from 'react';

type Kind = 'A' | 'B' | 'C';
const ZONE: Record<Kind, { t: string; d: string }> = {
  A: { t: 'What the customer sees', d: 'The product itself. Only what a café or roaster would see.' },
  B: { t: 'What PayPal’s credit team sees', d: 'The funder console: how the AI decided, the evidence it read, and every PayPal ID.' },
  C: { t: 'Demo controls · judges only', d: 'Not part of the product. Here to run and explain the demo.' },
};

export function Zone({ kind, title, note, right, children, className = '' }: { kind: Kind; title?: string; note?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const z = ZONE[kind];
  return (
    <section className={`zone zone-${kind.toLowerCase()} ${className}`} aria-label={`Zone ${kind}. ${title ?? z.t}`}>
      <div className="zone-head">
        <span className="zone-badge" aria-hidden>{kind}</span>
        <div className="min-w-0 flex-1">
          <div className="zone-title">{title ?? z.t}</div>
          <div className="zone-note">{note ?? z.d}</div>
        </div>
        {right && <div className="zone-right">{right}</div>}
      </div>
      <div className="zone-body">{children}</div>
    </section>
  );
}

type View = 'desktop' | 'phone';

// Zone A with a device frame and a desktop/phone toggle. The frame keeps the same element tree in both sizes,
// so toggling never remounts the content (the PayPal button iframe survives). ?view=phone or ?view=desktop overrides
// the default, which the video recorder uses.
export function CustomerZone({ initial, url, title, note, children }: { initial: View; url: string; title?: string; note?: string; children: React.ReactNode }) {
  const [view, setView] = useState<View>(initial);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    if (v === 'phone' || v === 'desktop') setView(v);
    else if (window.innerWidth < 640) setView('phone'); // On a real phone, start with the phone view.
  }, []);
  const toggle = (
    <div className="seg" role="group" aria-label="Device size">
      {(['desktop', 'phone'] as const).map((v) => (
        <button key={v} type="button" aria-pressed={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'desktop' ? 'Desktop' : 'Phone'}</button>
      ))}
    </div>
  );
  return (
    <Zone kind="A" title={title} note={note} right={toggle}>
      <div className={`frame frame-${view}`}>
        <div className="frame-bar" aria-hidden>
          <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
          <span className="frame-url">{url}</span>
        </div>
        <div className="frame-screen @container">{children}</div>
      </div>
    </Zone>
  );
}
