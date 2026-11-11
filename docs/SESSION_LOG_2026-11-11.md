# Session log. Sandbox spikes S1 to S4

Date. Wednesday 11 Nov 2026, about 09.12 to 10.05 Sydney time (22.12 to 23.05 UTC on 10 Nov).
Done by. Claude Code (model Opus 5.5), working with the entrant, who clicked through the PayPal dashboard and the PayPal approval page.
Scope. Only tests S1 to S4 from PRD section 12. No app code was written.

This file explains everything that happened so another person or AI tool can check it. The raw record written by the scripts is `scripts/spikes/RESULTS.md`. Every PayPal call listed here has a PayPal debug ID, which PayPal support can look up.

> **Correction, 11 Nov 12.36 Sydney.** The entrant found that `larkspur.termsheet@example.com` was created as a **Personal** sandbox account by mistake, not Business. So every S1, S2 and S3 result so far used a **personal payer**. S2 proves buyer absent charging for a personal account only, which is the PRD 12 fallback ("owner's PayPal"). **Charging a business payer is still unproven.** Next step is a new Business Larkspur account, then rerun S1 and S2.

## 1. Summary

| Test | Result | Key evidence (PayPal debug IDs) | What the build should use |
|---|---|---|---|
| S1 save PayPal account, no purchase | **FAIL** (403 NOT_AUTHORIZED, 3 tries) | `ca5888a7dbb52`, `ca588900678c1`, `ca58899b50a43` | Not usable yet |
| S1 fallback, save during a $1 deposit | **PASS**, vault status VAULTED | create `ca5889a044a1d`, capture `f9295161ffc4e`, order `03Y16307D3810153H` | **Use this** (PRD 6.7) |
| S2 charge vault ID, buyer absent, business payer | **PASS**, order and capture COMPLETED at create | `f3935969bd3f6`, order `4LY60806B3765842M`, capture `22K43434RM1882219` | PRD 6.4 as written |
| S3 decline, method A | **FAIL**, 403 with empty body | capture `f931528eacd7f`, auth `87R993326S965680S` voided `f3025458f881c` | No |
| S3 decline, method B | **Not applicable** | The method A order was already authorised at create, so there was nothing to authorise | No |
| S3 decline, method C | **PASS**, 422 INSTRUMENT_DECLINED | `f711539b3a81e` | **Use this** |
| S4 payout to supplier | **PASS**, batch SUCCESS, item SUCCESS | create `f18712422d610`, final poll `f1529982e6e54`, batch `M7TMQ46TR4S5Y` | PRD 6.5. Polling only, webhook not tested |

## 2. Setup done in this session

### 2.1 Local folder and repo
- Cloned `github.com/paragpandyareal/Paypalai`, branch `claude/paypal-hackathon-termsheet-skt5o9`, into a local folder named `TermSheet`.
- Afterwards a new **private** repo was made at `github.com/paragpandyareal/termsheet` and the same history was pushed as `main`. In the local folder, remote `origin` is the new repo and remote `paypalai` is the old one. The old branch was left untouched as a backup.
- Added `.gitignore` covering `.env`, `.env.*`, `scripts/spikes/.state.json` and `node_modules/`. A check of the full git history (`git log --all --name-only`) found no `.env` or `.state.json` ever committed.

### 2.2 Secrets handling
- The four values (`FUNDER_CLIENT_ID`, `FUNDER_CLIENT_SECRET`, `SUPPLIER_EMAIL`, `BUYER_LARKSPUR_EMAIL`) were not in the environment. No secure form tool was available, so a blank `.env` was opened in Notepad and the entrant pasted the values there. No secret was typed in chat.
- At the entrant's request, a Claude Code hook was added to the user's global settings (`~/.claude/settings.json`, PreToolUse, script `~/.claude/hooks/guard-env.js`). It blocks Read, Edit, Write, Grep, Glob, Bash and PowerShell calls that touch any `.env` file. The only command it allows is `node --env-file=.env scripts/spikes/<name>.mjs`, optionally with a one-word argument. It was tested with six cases (Windows and Unix paths, `cat`, `Get-Content`, a `node -e` leak attempt, a spike run and a normal read). All six behaved as expected. Claude never read `.env`.
- `RESULTS.md` masks every email address as `<email>`.

### 2.3 PayPal sandbox (developer.paypal.com, new developer login created 11 Nov)
The login was brand new and only had PayPal's automatic Default Application and two random default accounts. These were added. All are **US Business** accounts made with Create account, then Custom.

| Account | Email | Notes |
|---|---|---|
| TermSheet Funding (funder) | `funder@termsheet.example.com` | Balance about 99,999. Has the REST app |
| Ridgeline Roasters (supplier) | `ridgeline.termsheet@example.com` | Balance 5,000. No REST app yet |
| Larkspur Cafe (buyer) | `larkspur.termsheet@example.com` | Balance 50,000. Visa ending 3305 and a bank account ending 7410. No REST app yet |

Passwords were chosen by the entrant and are not recorded here.

Not made yet. Second Shot Café, Northgate Resale LLC, Pier 9 Deli, Walk in customers, and REST apps for Ridgeline and the cafés.

REST app "TermSheet Funding", type **Merchant**, linked to the funder account. Features ticked by the entrant were Save payment methods (the dashboard's name for Vault), Payouts, Invoicing and Transaction search.

Gotchas found during setup.
- The Custom account form has no business name field. First and last name were used for the names.
- The form rejected `ridgeline@termsheet.example.com` as invalid, but accepted `ridgeline.termsheet@example.com`.
- The PayPal balance field cannot be left blank.

## 3. The scripts

All are in `scripts/spikes/`. They use plain Node 26 with built-in `fetch`, and there are no dependencies. Run them from the repo root with `node --env-file=.env scripts/spikes/<file>`.

| File | What it does |
|---|---|
| `lib.mjs` | OAuth token for the funder app, one `pp()` helper per call (adds `PayPal-Request-Id` and `Prefer: return=representation`, captures the `Paypal-Debug-Id` header), local state file, and `record()`, which appends to `RESULTS.md` |
| `s1-save-account.mjs start\|finish` | PRD 6.3. Setup token, approval link, then swap for a payment token |
| `s1-fallback-deposit.mjs start\|finish` | PRD 12 fallback. $1 CAPTURE order with `payment_source.paypal.attributes.vault.store_in_vault: ON_SUCCESS`, `usage_type: MERCHANT`, `customer_type: BUSINESS`. After approval, captures and reads `payment_source.paypal.attributes.vault.id` |
| `s2-charge-absent.mjs` | PRD 6.4. $20 CAPTURE order with `payment_source.paypal.vault_id` |
| `s3-decline.mjs` | PRD 6.6. Tries A, then B, then C, and voids any real authorisation |
| `s4-payout.mjs` | PRD 6.5. $19.40 payout to `SUPPLIER_EMAIL`, polled every 3 s for up to 3 minutes |
| `scopes.mjs` | Diagnostic. Prints which OAuth scopes the funder app token has (no secrets) |

The vault ID, customer ID and order IDs are kept in `scripts/spikes/.state.json`, which git ignores.

## 4. Test detail, in the order it happened

### S1. Save without purchase. FAIL
- `POST /v3/vault/setup-tokens` with the body from PRD 6.3 (example.com return and cancel URLs) returned **403 NOT_AUTHORIZED**, "Authorization failed due to insufficient permissions".
- Try 1, debug `ca5888a7dbb52`. This try was not written to RESULTS.md, because of a path bug in `lib.mjs` (a space in "Claude Code" was URL-encoded). The bug was fixed with `fileURLToPath`.
- The entrant then ticked Save payment methods, Payouts, Invoicing and Transaction search and saved. Try 2, debug `ca588900678c1`, also returned 403.
- `scopes.mjs` showed the app token had 28 scopes. It included `vault/credit-card` (old v1) and `payments/payouts`, but **no v3 vault payment-token scope, and no invoicing or reporting scope**. That suggests the saved feature changes had not reached the app.
- The scopes were polled every 15 s for 6 minutes with no change. Try 3, debug `ca58899b50a43`, still returned 403.
- Likely cause, **not confirmed**. Either PayPal is slow to apply new features on a brand new developer login, or the "Save payment methods" tick did not save. Worth retrying later and checking the scopes again with `scopes.mjs`.

### S1 fallback. Save during a deposit order. PASS
- Create `POST /v2/checkout/orders` returned 200, debug `ca5889a044a1d`, order `03Y16307D3810153H`. PayPal accepted the vault attributes even though the app lacked the v3 setup-token permission.
- The entrant opened the approval link and logged in as Larkspur. The page showed "Set up once. Pay faster next time. We'll save your choice for future payments to TermSheet Funding". They chose Visa ••3305 with Pay in full and clicked Agree and Pay. The redirect to example.com was expected.
- Capture `POST /v2/checkout/orders/03Y16307D3810153H/capture` returned 201, debug `f9295161ffc4e`. The vault status was **VAULTED** and a vault ID came back.

### S2. Charge with the buyer absent. PASS
- `POST /v2/checkout/orders` with intent CAPTURE, $20.00 and the vault ID from the fallback returned **201**, debug `f3935969bd3f6`.
- Order `4LY60806B3765842M` was COMPLETED and capture `22K43434RM1882219` was COMPLETED, both inside the create response.
- **A US business sandbox account can be charged buyer absent.** This was the main unproven risk in the PRD.

### S3. Test decline. PASS with method C
- Method A. AUTHORIZE order for $15 with the vault ID returned 201, debug `f68088968f187`, already authorised at create (authorisation `87R993326S965680S`). Then `POST /v2/payments/authorizations/87R993326S965680S/capture` was sent with header `PayPal-Mock-Response: {"mock_application_codes":"INSTRUMENT_DECLINED"}`. It returned **403 with an empty body**, debug `f931528eacd7f`. The authorisation was then voided with 200, debug `f3025458f881c`.
- Method B. Skipped, because the order was already authorised, so there was no order to call `/authorize` on.
- Method C. AUTHORIZE order create with the same mock header returned **422 UNPROCESSABLE_ENTITY, issue INSTRUMENT_DECLINED**, debug `f711539b3a81e`. No order was created, so there was nothing to void.
- Not tried. Method C with intent CAPTURE (the build will probably want this), and method A again once the app permissions are fixed.

### S4. Payout. PASS
- `POST /v1/payments/payouts` for $19.40 USD to the Ridgeline email returned 201, debug `f18712422d610`, batch `M7TMQ46TR4S5Y`.
- Polling every 3 s showed the item SUCCESS early while the batch was still PROCESSING. The batch then reached **SUCCESS**, debug `f1529982e6e54`, within the 3 minute window.
- The webhook was not tested, because there is no public HTTPS address yet.

## 5. Money moved in the sandbox (all test money)
- $1.00 Larkspur to TermSheet Funding (S1 fallback deposit).
- $20.00 Larkspur to TermSheet Funding (S2).
- $15.00 authorised then voided (S3 method A). Nothing captured.
- $19.40 TermSheet Funding to Ridgeline Roasters (S4).

## 6. How another tool can verify this
1. Read `scripts/spikes/RESULTS.md`. Each entry has the request sent, the status, the debug ID and, for failures, the response.
2. Log in to sandbox.paypal.com as the funder account and look for the $1.00 and $20.00 payments from Larkspur Cafe and the $19.40 payout to Ridgeline. Log in as Ridgeline and look for the $19.40 received.
3. Re-run from the repo root (needs `.env`).
   - `node --env-file=.env scripts/spikes/scopes.mjs` checks whether the vault permission has appeared.
   - `node --env-file=.env scripts/spikes/s2-charge-absent.mjs` charges $20 again with the stored vault ID (needs `.state.json` from this machine).
   - `node --env-file=.env scripts/spikes/s3-decline.mjs` and `node --env-file=.env scripts/spikes/s4-payout.mjs` repeat those tests.
   - Each run appends a new entry to `RESULTS.md`.
4. To retry the main S1, run `node --env-file=.env scripts/spikes/s1-save-account.mjs start`, approve the link as Larkspur, then run it again with `finish`.

## 7. Open items for the next session
- Retry S1 without a purchase after confirming that "Save payment methods" is ticked and that `scopes.mjs` shows a vault payment-token scope.
- Check method C works with intent CAPTURE, which is how the due date charge will run.
- Tests S5 to S8 have not been run.
- The rest of the sandbox cast and the REST apps for the buyers and supplier are not made yet (PRD 5.3).
- Make the termsheet repo public before submitting.

## 8. Addendum, 11 Nov 10.22 to 12.30 Sydney (after an outside review)

An outside AI review raised seven points. Each was checked.

| Point | Finding | Action and evidence |
|---|---|---|
| Missing scopes, maybe a reused access token | **Confirmed.** At 10.26 the token endpoint returned a fresh token (`expires_in` 32400) with 33 scopes instead of 28, now including vault payment tokens, invoicing and reporting. The earlier 28 scope token was issued before the features were ticked and was reused. A new app is not needed | `scripts/spikes/token-age.mjs`, `scopes.mjs` |
| S1 no purchase save | **PASS.** Setup token 201 (debug `f66980480ff30`), entrant approved as Larkspur at about 12.27, payment token 200 (debug `f825872f8efad`) | `s1-save-account.mjs` |
| S2 rerun with the new vault ID | **PASS.** Order `1FA19092MJ990710K` and capture `90770893SM086721E` COMPLETED (debug `f77816880793b`) | `s2-charge-absent.mjs` |
| Decline only tested with AUTHORIZE | Method C with intent CAPTURE also **PASSES**. 422 INSTRUMENT_DECLINED (debug `f7866046ff4b4`), no order created | `s3c-capture.mjs` |
| $1 deposit breaks "charged $0" | Deposit refunded as a verification charge. Capture `4EM07518CA296962F`, refund 201 (debug `f17861065bc81`). The no purchase path is now in use, so $0 holds. PRD 6.3 says which path is in use | `refund-deposit.mjs` |
| Old vault ID in git history | The old fallback saved account was deleted. DELETE 204 (debug `f595334d7cd4f`), read back 404 (debug `f35352771bdbb`). The ID in history is now dead. History was not rewritten | `delete-old-vault.mjs` |
| README and PRD contradicted the results | README 1b, the README research note and section 4, and PRD 6.3 and 6.6 were updated | Commits on `main` |
| Vault ID and local path visible | Masked in RESULTS.md (and in future runs by `lib.mjs`) and in this log | |

Still not run. S5 (two SDK copies), S6 (Agent Toolkit reads on the supplier app) and S7 (café's own sales). All three need REST apps for Ridgeline and Larkspur, which do not exist yet.

## 9. Correction, 11 Nov 12.36 Sydney

**Correction, 11 Nov 12.36 Sydney.** The entrant found that `larkspur.termsheet@example.com` was created as a **Personal** sandbox account by mistake, not Business. So every S1, S2 and S3 result so far used a **personal payer**. S2 proves buyer absent charging for a personal account only, which is the PRD 12 fallback ("owner's PayPal"). **Charging a business payer is still unproven.** Next step is a new Business Larkspur account, then rerun S1 and S2.

What this changes. Section 1 and section 8 say "business payer" for S2. That is wrong, the payer was personal. S1 and S3 results still hold for the funder app but were also run against a personal payer. The Larkspur row in section 2.3 should read Personal.

## 10. Business payer rerun

**Business payer proven, 11 Nov 12.45 Sydney.** The personal Larkspur account was deleted and `larkspur.termsheet@example.com` was recreated as a **Business** account. On it, S1 no purchase save PASS (payment token debug `f434131f90084`), S2 buyer absent CAPTURE PASS (order `7LL66346VM5734515`, capture `9TG326348T078043C`, debug `f201904e51969`), and S3 method C with CAPTURE PASS (422 INSTRUMENT_DECLINED, debug `f156045203d2d`). Earlier vault IDs belonged to the deleted personal account and are dead.
