import { acceptPlan } from '@/lib/ledger/service';
export const dynamic = 'force-dynamic';

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const r = await acceptPlan(id);
    return Response.json({ ok: !!r?.completed, debugId: r?.debugId, captureId: r?.captureId });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 400 });
  }
}
