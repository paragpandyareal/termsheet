import { getState } from '@/lib/ledger/state';
export const dynamic = 'force-dynamic';
export async function GET() { return Response.json(await getState()); }
