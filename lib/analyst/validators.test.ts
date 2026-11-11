// The core safety claim: code, not the AI, decides what is allowed.
// These tests feed hand-made AI outputs to the same validators the live loop uses.
import { describe, it, expect } from 'vitest';
import { validateDecision, validatePlan } from './run';
import type { ToolCtx } from './tools';

const ev = (ids: string[]) => new Map(ids.map((id) => [id, { id, source: 'test', summary: id } as any]));
const ctx = (over: Partial<ToolCtx> = {}): ToolCtx => ({
  runId: 'run_test', buyerId: 'b', buyerKey: 'larkspur', orderId: 'o',
  evidence: ev(['txn:1', 'txn:2', 'sales:larkspur:30d', 'sales:larkspur:7d', 'doc:letter', 'app:foundedYear', 'msg:m1', 'policy:scorecard']),
  facts: { orderCents: 200000, score: { ceiling: { outcome: 'APPROVE', limitCents: 500000, termDays: 30, depositPct: 0, tier: 'A' } } },
  ...over,
});
const good = () => ({
  outcome: 'APPROVE', limit_cents: 500000, term_days: 30, deposit_pct: 0, factor_codes: [], confidence: 'HIGH',
  summary: 'Approved.', would_change: 'A missed payment.', contradictions: [],
  memo: [{ text: '14 orders paid in full.', evidence_ids: ['txn:1', 'txn:2'] }],
});

describe('validateDecision: citations', () => {
  it('accepts a clean, fully cited approval', () => {
    expect(validateDecision(good(), ctx())).toEqual([]);
  });
  it('rejects a sentence that cites an ID no tool returned', () => {
    const d = { ...good(), memo: [{ text: 'Made up.', evidence_ids: ['txn:999'] }] };
    expect(validateDecision(d, ctx()).join()).toMatch(/Unknown evidence ID txn:999/);
  });
  it('rejects a sentence with no citation at all', () => {
    const d = { ...good(), memo: [{ text: 'Trust me.', evidence_ids: [] }] };
    expect(validateDecision(d, ctx()).join()).toMatch(/needs text and evidence_ids/);
  });
  it('rejects an empty memo', () => {
    expect(validateDecision({ ...good(), memo: [] }, ctx()).join()).toMatch(/memo must be a non-empty array/);
  });
  it('a contradiction must cite both sides', () => {
    const d = { ...good(), outcome: 'REFER', contradictions: [{ text: 'Letter says 2024.', evidence_ids: ['doc:letter'] }] };
    expect(validateDecision(d, ctx()).join()).toMatch(/must cite both sides/);
    const ok = { ...good(), outcome: 'REFER', contradictions: [{ text: 'Letter says 2024, form says 2019.', evidence_ids: ['doc:letter', 'app:foundedYear'] }] };
    expect(validateDecision(ok, ctx())).toEqual([]);
  });
  it('rejects an unknown factor code', () => {
    expect(validateDecision({ ...good(), factor_codes: ['ZZ99'] }, ctx()).join()).toMatch(/Unknown factor code ZZ99/);
  });
});

describe('validateDecision: the AI can only tighten', () => {
  it('cannot raise the limit above the scorecard ceiling', () => {
    expect(validateDecision({ ...good(), limit_cents: 5000000 }, ctx()).join()).toMatch(/above the ceiling/);
  });
  it('cannot lengthen the term', () => {
    expect(validateDecision({ ...good(), term_days: 60 }, ctx()).join()).toMatch(/term is longer/);
  });
  it('cannot approve when the scorecard says decline', () => {
    const c = ctx({ facts: { orderCents: 200000, score: { ceiling: { outcome: 'DECLINE', limitCents: 0, termDays: 0, depositPct: 0 } } } });
    expect(validateDecision(good(), c).join()).toMatch(/You cannot approve/);
  });
  it('an approval must cover the order', () => {
    expect(validateDecision({ ...good(), limit_cents: 100000 }, ctx()).join()).toMatch(/must cover the order/);
  });
  it('no deposits', () => {
    expect(validateDecision({ ...good(), deposit_pct: 20 }, ctx()).join()).toMatch(/deposit_pct must be 0/);
  });
  it('the scorecard must have run (get_policy called)', () => {
    expect(validateDecision(good(), ctx({ facts: { orderCents: 200000 } })).join()).toMatch(/get_policy was not called/);
  });
  it('declining or referring is always allowed', () => {
    expect(validateDecision({ ...good(), outcome: 'DECLINE', limit_cents: 0, term_days: 0 }, ctx())).toEqual([]);
    expect(validateDecision({ ...good(), outcome: 'REFER', limit_cents: 0, term_days: 0 }, ctx())).toEqual([]);
  });
});

const plan = () => ({
  story_check: { consistent: true, claim: 'Can pay half Friday', text: 'Sales cover it.', evidence_ids: ['msg:m1', 'sales:larkspur:7d'] },
  instalments: [{ amount_cents: 50000, due_in_days_from_original: 0 }, { amount_cents: 50000, due_in_days_from_original: 15 }],
  message_to_buyer: 'Here is a plan: $500 today and $500 in 15 days. No fees.',
  memo: [{ text: 'Split in two.', evidence_ids: ['policy:scorecard'] }],
});

describe('validatePlan', () => {
  it('accepts a plan inside the policy box', () => {
    expect(validatePlan(plan(), ctx(), 100000)).toEqual([]);
  });
  it("story check must cite the café's own message and a sales figure", () => {
    const p = { ...plan(), story_check: { ...plan().story_check, evidence_ids: ['sales:larkspur:7d'] } };
    expect(validatePlan(p, ctx(), 100000).join()).toMatch(/must cite the café's message/);
    const q = { ...plan(), story_check: { ...plan().story_check, evidence_ids: ['msg:m1'] } };
    expect(validatePlan(q, ctx(), 100000).join()).toMatch(/must cite a sales figure/);
  });
  it('rejects invented evidence IDs', () => {
    const p = { ...plan(), memo: [{ text: 'x', evidence_ids: ['sales:fake'] }] };
    expect(validatePlan(p, ctx(), 100000).join()).toMatch(/Unknown evidence ID sales:fake/);
  });
  it('amounts must add up to the balance', () => {
    const p = { ...plan(), instalments: [{ amount_cents: 50000, due_in_days_from_original: 0 }, { amount_cents: 40000, due_in_days_from_original: 15 }] };
    expect(validatePlan(p, ctx(), 100000).length).toBeGreaterThan(0);
  });
  it('the message must state the same dollar amounts as the plan', () => {
    const p = { ...plan(), message_to_buyer: 'Pay some now and the rest later.' };
    expect(validatePlan(p, ctx(), 100000).join()).toMatch(/must state the instalment amount/);
  });
  it('the message must be under 60 words', () => {
    const p = { ...plan(), message_to_buyer: '$500 today and $500 later. ' + 'word '.repeat(70) };
    expect(validatePlan(p, ctx(), 100000).join()).toMatch(/over 60 words/);
  });
  it('the final payment cannot be later than 15 days after the due date', () => {
    const p = { ...plan(), instalments: [{ amount_cents: 50000, due_in_days_from_original: 0 }, { amount_cents: 50000, due_in_days_from_original: 30 }] };
    expect(validatePlan(p, ctx(), 100000).length).toBeGreaterThan(0);
  });
});
