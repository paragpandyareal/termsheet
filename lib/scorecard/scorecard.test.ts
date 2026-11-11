import { describe, it, expect } from 'vitest';
import { score, checkPlan, ceilingFor } from './scorecard';
import { limitAfterOnTime, limitAfterFailure, available, payoutFor, addDays } from '../ledger/rules';

const base = { invoicesTotal: 0, invoicesLateOrReminded: 0, disputes: 0, supplierMedianOrderCents: 115000, repayment: 'NONE' as const };

describe('scorecard sc-1', () => {
  it('Larkspur scores tier A', () => {
    const r = score({ ...base, paidOrdersWithSupplier: 14, invoicesTotal: 16, invoicesLateOrReminded: 2, orderCents: 200000, buyerSales30dCents: 1840000, buyerAvgOrderCents: 115000 });
    expect(r.ceiling.tier).toBe('A');
    expect(r.ceiling.limitCents).toBe(500000);
  });
  it('Northgate style buyer is declined', () => {
    const r = score({ ...base, paidOrdersWithSupplier: 0, orderCents: 1035000, buyerSales30dCents: null, buyerAvgOrderCents: null });
    expect(r.ceiling.outcome).toBe('DECLINE');
    expect(r.reasonCodes).toContain('TH01');
    expect(r.reasonCodes).toContain('CF04');
  });
  it('tiers', () => {
    expect(ceilingFor(70).tier).toBe('A');
    expect(ceilingFor(69).tier).toBe('B');
    expect(ceilingFor(30).depositPct).toBe(30);
    expect(ceilingFor(29).outcome).toBe('DECLINE');
  });
});

describe('policy box', () => {
  it('accepts the demo plan', () => {
    expect(checkPlan(200000, [{ amount_cents: 100000, due_in_days_from_original: 0 }, { amount_cents: 100000, due_in_days_from_original: 15 }]).ok).toBe(true);
  });
  it('rejects three instalments, late final, small first, wrong sum', () => {
    expect(checkPlan(300000, [1, 2, 3].map((n) => ({ amount_cents: 100000, due_in_days_from_original: n === 1 ? 0 : 5 }))).ok).toBe(false);
    expect(checkPlan(200000, [{ amount_cents: 100000, due_in_days_from_original: 0 }, { amount_cents: 100000, due_in_days_from_original: 16 }]).ok).toBe(false);
    expect(checkPlan(200000, [{ amount_cents: 40000, due_in_days_from_original: 0 }, { amount_cents: 160000, due_in_days_from_original: 10 }]).ok).toBe(false);
    expect(checkPlan(200000, [{ amount_cents: 100000, due_in_days_from_original: 0 }, { amount_cents: 90000, due_in_days_from_original: 10 }]).ok).toBe(false);
  });
});

describe('limit rules', () => {
  it('on time raises by 50%, capped', () => {
    expect(limitAfterOnTime(500000, 500000)).toBe(750000);
    expect(limitAfterOnTime(750000, 500000)).toBe(750000);
    expect(limitAfterOnTime(900000, 900000)).toBe(1000000);
  });
  it('failure drops to max(1000, 20%)', () => {
    expect(limitAfterFailure(500000)).toBe(100000);
    expect(limitAfterFailure(1000000)).toBe(200000);
  });
  it('available and payout', () => {
    expect(available(500000, 200000)).toBe(300000);
    expect(payoutFor(200000)).toEqual({ payoutCents: 194000, feeCents: 6000 });
    expect(addDays('2026-11-11', 30)).toBe('2026-12-11');
  });
});
