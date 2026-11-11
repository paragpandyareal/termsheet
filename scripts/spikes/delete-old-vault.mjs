// Deletes the old saved account from the S1 fallback, so its ID (still in git history) is dead.
// node --env-file=.env scripts/spikes/delete-old-vault.mjs
import { pp, record, loadState, saveState } from './lib.mjs';
const { oldVaultId } = loadState();
if (!oldVaultId) { console.log('Nothing to delete.'); process.exit(0); }
const del = await pp('DELETE', `/v3/vault/payment-tokens/${oldVaultId}`);
const chk = await pp('GET', `/v3/vault/payment-tokens/${oldVaultId}`);
const pass = del.status === 204 && chk.status === 404;
del.sent.url = del.sent.url.replace(oldVaultId, '<old vault id>');
chk.sent.url = chk.sent.url.replace(oldVaultId, '<old vault id>');
if (pass) saveState({ oldVaultId: null });
record('Cleanup. Delete the old fallback saved account (PRD 6.8 close a line)', pass, [del, chk], `Delete ${del.status}, then read back ${chk.status} (404 means gone).`);
