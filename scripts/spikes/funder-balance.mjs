// Shows the funder sandbox account's balance, so Payouts do not run dry during judging.
//   node --env-file=.env scripts/spikes/funder-balance.mjs
import { pp } from './lib.mjs';
const r = await pp('GET', '/v1/reporting/balances?currency_code=USD');
const b = (r.body?.balances || []).find((x) => x.currency === 'USD');
if (b) console.log(`Funder USD balance: available ${b.available_balance?.value}, total ${b.total_balance?.value}`);
else console.log('Could not read the balance:', JSON.stringify(r.body).slice(0, 300));
