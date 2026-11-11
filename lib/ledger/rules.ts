// PRD 7.1. Limit rules and state rules, plain code, no AI, no I/O.
export const MAX_LIMIT_CENTS = 1_000_000;
export const FEE_PCT = 3; // ASSUMPTION, shown with a chip in the UI.

export function limitAfterOnTime(limitCents: number, ceilingCents: number) {
  return Math.min(Math.round(limitCents * 1.5), Math.round(ceilingCents * 1.5), MAX_LIMIT_CENTS);
}
export function limitAfterFailure(limitCents: number) {
  return Math.max(100_000, Math.round(limitCents * 0.2));
}
export function available(limitCents: number, openPrincipalCents: number) {
  return Math.max(0, limitCents - openPrincipalCents);
}
export function payoutFor(orderCents: number) {
  const fee = Math.round((orderCents * FEE_PCT) / 100);
  return { payoutCents: orderCents - fee, feeCents: fee };
}

export type RcvStatus = 'OPEN' | 'PAID' | 'PAST_DUE' | 'RESTRUCTURED' | 'WRITTEN_OFF';
export function receivableAfterCharge(status: RcvStatus, success: boolean, allInstalmentsPaid: boolean): RcvStatus {
  if (!success) return status === 'RESTRUCTURED' ? 'PAST_DUE' : 'PAST_DUE';
  return allInstalmentsPaid ? 'PAID' : status;
}
export function lineStatus(anyPastDue: boolean) {
  return anyPastDue ? 'FROZEN' : 'ACTIVE';
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function appDate(offsetDays: number, now = new Date()) {
  return addDays(now.toISOString().slice(0, 10), offsetDays);
}
