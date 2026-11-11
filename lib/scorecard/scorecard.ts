// PRD section 8. Plain, versioned, no AI. Sets the ceiling the analyst can only go below.
export const SCORECARD_VERSION = 'sc-1';

export type ScoreInput = {
  paidOrdersWithSupplier: number;
  invoicesTotal: number;            // invoices on file with this supplier
  invoicesLateOrReminded: number;   // paid late or after a reminder
  disputes: number;
  orderCents: number;
  buyerSales30dCents: number | null; // null = no data
  buyerAvgOrderCents: number | null; // null = no history, use supplier median
  supplierMedianOrderCents: number;
  repayment: 'FAILED_90D' | 'NONE' | 'ON_TIME';
};

export type Factor = { code: string; label: string; points: number; max: number; detail: string };
export type Tier = 'A' | 'B' | 'C' | 'D';
export type Ceiling = { tier: Tier; outcome: 'APPROVE' | 'COUNTEROFFER' | 'DECLINE'; limitCents: number; termDays: number; depositPct: number };

export const REASONS: Record<string, string> = {
  TH01: 'Limited trade history with this supplier',
  PB02: 'Recent invoices were paid late',
  DS03: 'Open or recent payment disputes',
  CF04: 'Order is large compared with recent sales',
  OS05: 'Order is much larger than usual',
  VR06: 'Information could not be verified',
  OB07: 'Order is inconsistent with the stated business',
  RP08: 'A recent payment on terms failed',
};

export function score(i: ScoreInput) {
  const f: Factor[] = [];
  const th = i.paidOrdersWithSupplier;
  f.push({ code: 'TH', label: 'Paid orders with this supplier', max: 25, points: th >= 13 ? 25 : th >= 6 ? 18 : th >= 1 ? 10 : 0, detail: `${th} paid orders` });

  let pb: number, pbd: string;
  if (i.invoicesTotal === 0) { pb = 8; pbd = 'No invoices on file'; }
  else {
    const share = i.invoicesLateOrReminded / i.invoicesTotal;
    pb = share > 0.5 ? 0 : share >= 0.2 ? 8 : 15;
    pbd = `${i.invoicesLateOrReminded} of ${i.invoicesTotal} late or after a reminder`;
  }
  f.push({ code: 'PB', label: 'Invoices paid late or after a reminder', max: 15, points: pb, detail: pbd });

  f.push({ code: 'DS', label: 'Disputes with this supplier', max: 10, points: i.disputes >= 2 ? 0 : i.disputes === 1 ? 5 : 10, detail: `${i.disputes} disputes` });

  let cf = 0, cfd = 'No sales data';
  if (i.buyerSales30dCents && i.buyerSales30dCents > 0) {
    const s = i.orderCents / i.buyerSales30dCents;
    cf = s > 0.5 ? 0 : s >= 0.25 ? 8 : s >= 0.1 ? 15 : 20;
    cfd = `Order is ${(s * 100).toFixed(0)}% of 30 day PayPal sales`;
  }
  f.push({ code: 'CF', label: 'Order size against recent sales', max: 20, points: cf, detail: cfd });

  const base = i.buyerAvgOrderCents ?? i.supplierMedianOrderCents;
  const ratio = base > 0 ? i.orderCents / base : 99;
  f.push({ code: 'OS', label: 'Order size against usual', max: 10, points: ratio > 5 ? 0 : ratio >= 2 ? 5 : 10, detail: `${ratio.toFixed(1)}x the ${i.buyerAvgOrderCents ? "buyer's average" : "supplier's median"} order` });

  f.push({ code: 'RP', label: 'TermSheet repayment record', max: 10, points: i.repayment === 'FAILED_90D' ? 0 : i.repayment === 'NONE' ? 5 : 10, detail: i.repayment === 'FAILED_90D' ? 'Failed charge in last 90 days' : i.repayment === 'NONE' ? 'No record yet' : 'All on time' });

  const total = f.reduce((a, b) => a + b.points, 0);
  return { version: SCORECARD_VERSION, total, factors: f, ceiling: ceilingFor(total), reasonCodes: reasonCodes(f) };
}

export function ceilingFor(total: number): Ceiling {
  if (total >= 70) return { tier: 'A', outcome: 'APPROVE', limitCents: 500000, termDays: 30, depositPct: 0 };
  if (total >= 50) return { tier: 'B', outcome: 'APPROVE', limitCents: 250000, termDays: 30, depositPct: 0 };
  if (total >= 30) return { tier: 'C', outcome: 'COUNTEROFFER', limitCents: 100000, termDays: 30, depositPct: 30 };
  return { tier: 'D', outcome: 'DECLINE', limitCents: 0, termDays: 0, depositPct: 0 };
}

// Factors scoring under half their maximum become reason codes.
function reasonCodes(f: Factor[]) {
  const map: Record<string, string> = { TH: 'TH01', PB: 'PB02', DS: 'DS03', CF: 'CF04', OS: 'OS05', RP: 'RP08' };
  return f.filter((x) => x.points < x.max / 2).map((x) => map[x.code]);
}

// PRD 8.5. Payment plan policy box, plain code.
export type Instalment = { amount_cents: number; due_in_days_from_original: number };
export function checkPlan(balanceCents: number, plan: Instalment[]) {
  const errors: string[] = [];
  if (plan.length < 1 || plan.length > 2) errors.push('At most 2 instalments.');
  const sum = plan.reduce((a, b) => a + b.amount_cents, 0);
  if (sum !== balanceCents) errors.push(`Instalments must sum to the balance exactly (${sum} vs ${balanceCents}).`);
  if (plan.some((p) => p.amount_cents <= 0 || !Number.isInteger(p.amount_cents))) errors.push('Amounts must be whole positive cents.');
  if (plan.some((p) => p.due_in_days_from_original > 15)) errors.push('Final instalment no later than 15 days after the original due date.');
  if (plan[0] && plan[0].amount_cents < Math.ceil(balanceCents * 0.25)) errors.push('First instalment must be at least 25% of the balance.');
  if (plan[0] && plan[0].due_in_days_from_original !== 0) errors.push('First instalment is charged on acceptance (day 0).');
  return { ok: errors.length === 0, errors };
}
