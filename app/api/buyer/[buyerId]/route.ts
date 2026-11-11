import { getBuyerView } from '@/lib/ledger/state';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, ctx: { params: Promise<{ buyerId: string }> }) {
  const { buyerId } = await ctx.params;
  return Response.json(await getBuyerView(buyerId));
}
