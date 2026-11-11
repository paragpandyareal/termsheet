// Shows the funder sandbox account's balances, so Payouts do not run dry during judging.
//   node --env-file=.env scripts/spikes/funder-balance.mjs
import { pp } from './lib.mjs';
const r = await pp('GET', '/v1/reporting/balances?include_crypto_currency=false');
for (const b of r.body?.balances || []) console.log(`${b.currency}: available ${b.available_balance?.value}, total ${b.total_balance?.value}, primary ${b.primary}`);
console.log('account_id', r.body?.account_id, 'as of', r.body?.as_of_time);
