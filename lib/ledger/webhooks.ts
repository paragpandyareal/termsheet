// Webhooks confirm what API results already recorded (PRD 6.9). The ledger never waits on them.
import { sql } from '@/lib/db';
export async function onWebhook(app: string, ev: any) {
  const r = ev.resource || {};
  if (ev.event_type === 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED' && r.payout_batch_id) {
    await sql("UPDATE payout SET status='SUCCESS', updated_at=now() WHERE batch_id=$1", [r.payout_batch_id]);
  }
}
