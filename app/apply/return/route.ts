// Flow A steps 6 to 8. PayPal sends the buyer back here after approving. Swap the setup token, store the vault ID, pay the supplier.
import { sql, one } from '@/lib/db';
import { exchangeSetupToken } from '@/lib/paypal/money';
import { fundOrder } from '@/lib/ledger/service';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('order') || '';
  const base = process.env.APP_BASE_URL || url.origin;
  const app = await one("SELECT * FROM application WHERE order_id=$1 AND setup_token_id IS NOT NULL ORDER BY created_at DESC LIMIT 1", [orderId]);
  if (!app) return Response.redirect(`${base}/apply/${orderId}?error=no_application`, 302);
  const r = await exchangeSetupToken(app.setup_token_id);
  if (!r.vaultId) return Response.redirect(`${base}/apply/${orderId}?error=save_failed&debug=${r.debugId}`, 302);
  await sql("UPDATE credit_line SET vault_id=$2, paypal_customer_id=$3, status='ACTIVE', updated_at=now() WHERE buyer_id=$1", [app.buyer_id, r.vaultId, r.customerId || null]);
  await fundOrder(orderId).catch((e) => console.error('fund', e));
  return Response.redirect(`${base}/apply/${orderId}?saved=1`, 302);
}
