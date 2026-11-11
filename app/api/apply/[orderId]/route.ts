// Flow A steps 3 and 4. Store the form and documents, then start the analyst.
import fs from 'node:fs';
import path from 'node:path';
import { sql, one, newId } from '@/lib/db';
import { startUnderwrite } from '@/lib/analyst/run';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const order = await one('SELECT o.*, b.key FROM orders o JOIN buyer b ON b.id=o.buyer_id WHERE o.id=$1', [orderId]);
  if (!order) return Response.json({ error: 'no order' }, { status: 404 });
  const form = await req.json().catch(() => ({}));
  const letter = String(form.letter || '').slice(0, 200_000);
  delete form.letter;
  await sql('DELETE FROM document WHERE buyer_id=$1', [order.buyer_id]);
  let text = letter;
  if (!text && order.key === 'northgate') text = fs.readFileSync(path.join(process.cwd(), 'scripts/seed/documents/northgate-letter.txt'), 'utf8');
  if (text) await sql("INSERT INTO document (id, buyer_id, kind, text) VALUES ($1,$2,'reference letter',$3)", [newId('doc'), order.buyer_id, text]);
  await sql("INSERT INTO application (id, order_id, buyer_id, form_json, status) VALUES ($1,$2,$3,$4,'RUNNING')", [newId('app'), orderId, order.buyer_id, JSON.stringify(form)]);
  await sql("UPDATE orders SET status='APPLIED', updated_at=now() WHERE id=$1", [orderId]);
  return Response.json({ runId: await startUnderwrite(orderId) });
}

export async function GET(_: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const order = await one('SELECT o.*, b.display_name, b.key FROM orders o JOIN buyer b ON b.id=o.buyer_id WHERE o.id=$1', [orderId]);
  const app = await one('SELECT * FROM application WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1', [orderId]);
  const run = await one("SELECT * FROM analyst_run WHERE subject_id=$1 AND kind='UNDERWRITE' ORDER BY started_at DESC LIMIT 1", [orderId]);
  const evidence = run ? await sql('SELECT evidence_id, source, summary FROM evidence WHERE run_id=$1 ORDER BY created_at', [run.id]) : [];
  const line = order ? await one('SELECT * FROM credit_line WHERE buyer_id=$1', [order.buyer_id]) : null;
  const payout = await one('SELECT * FROM payout WHERE order_id=$1', [orderId]);
  return Response.json({ order, app, run, evidence, line: line && { status: line.status, limit_cents: line.limit_cents, saved: !!line.vault_id }, payout });
}
