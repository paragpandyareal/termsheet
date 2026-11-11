import { advanceClock, jumpToNextDue, refreshPayouts } from '@/lib/ledger/service';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const { action } = await req.json().catch(() => ({ action: 'day' }));
  const r = action === 'next' ? await jumpToNextDue() : await advanceClock(1);
  await refreshPayouts().catch(() => {});
  return Response.json(r);
}
