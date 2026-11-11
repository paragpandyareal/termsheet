// What Ridgeline (the supplier) sees: every Net 30 order TermSheet funded, the fee, and the real Payout with its status.
import { sql } from '@/lib/db';
import { refreshPayouts, today, bootstrap } from '@/lib/ledger/service';
export const dynamic = 'force-dynamic';

// Payout status comes from PayPal. Ask at most every 20 seconds, however many people have the page open.
let lastRefresh = 0;

export async function GET() {
  await bootstrap();
  if (Date.now() - lastRefresh > 20_000) { lastRefresh = Date.now(); await refreshPayouts().catch(() => {}); }
  const rows = await sql(`SELECT p.id, p.amount_cents, p.fee_cents, p.status, p.batch_id, p.created_at, o.order_no, o.amount_cents AS order_cents,
      b.display_name AS buyer, r.due_date::text AS due, r.status AS rcv_status
    FROM payout p JOIN orders o ON o.id=p.order_id JOIN buyer b ON b.id=o.buyer_id LEFT JOIN receivable r ON r.order_id=o.id
    ORDER BY p.created_at DESC`);
  return Response.json({ today: await today(), rows });
}
