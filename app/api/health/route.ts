import { sql } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  await sql('SELECT 1');
  return Response.json({ ok: true, at: new Date().toISOString() });
}
