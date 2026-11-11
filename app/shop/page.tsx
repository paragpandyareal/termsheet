import { Suspense } from 'react';
import { clientId } from '@/lib/paypal/client';
import Shop from './shop';
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Suspense><Shop supplierClientId={clientId('supplier')} /></Suspense>;
}
