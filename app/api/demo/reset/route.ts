import { resetDemo } from '@/lib/ledger/service';
export const dynamic = 'force-dynamic';
let last = 0;
export async function POST() {
  if (Date.now() - last < 60_000) return Response.json({ ok: false, reason: 'Reset is limited to once a minute.' }, { status: 429 });
  last = Date.now();
  return Response.json(await resetDemo());
}
