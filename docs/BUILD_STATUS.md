# Build status. Read this first

Last updated Wednesday 11 Nov 2026, 14.15 Sydney (03.15 UTC). Deadline Thursday 12 Nov 2026, 20.00 UTC.

## 0. Where things stand
- **Phases 1 to 4 of PRD 13 are built and pushed to `main`** of the private repo github.com/paragpandyareal/termsheet. Phase 5 (README, judge mode) is in progress. `npm run build` passes. Not deployed yet, and no Render account exists yet.
- **The entrant tested the local app at 14.07 and says it works.** Visual polish is deferred until the features are complete.
- **Tested against the sandbox.**
  - Larkspur applies and the analyst approves $5,000 with 23 cited evidence rows. The account is saved and Ridgeline gets a $1,940 Payout.
  - Second Shot's day 30 charge gives INSTRUMENT_DECLINED (method C, debug `f3394068dd74c`). The limit drops to $1,000, the café replies, and a plan is proposed. Accepting it makes a real $1,000 capture (debug `ca589e8e4fd0d`).
- **Unit tests.** `npm test` runs 8 tests on the scorecard, policy box and limit rules. All pass.

## 1. Deviations from the PRD (all deliberate)

| PRD said | Built instead | Why |
|---|---|---|
| Prisma plus Docker Postgres | Plain SQL. Postgres in hosting (`DATABASE_URL`), PGlite locally | No Docker on the entrant's PC. PGlite fails inside OneDrive, so on Windows it lives in `%LOCALAPPDATA%/termsheet-pg` |
| AG Grid evidence grid | Plain HTML table with click to highlight | Fewer moving parts |
| Funder JS button for saving the account | PayPal's redirect approval link from the setup token | S5 found PayPal's sandbox button iframe sometimes returns 500 |
| Analyst always live | `ANALYST_MODE=mock` by default. Same live PayPal tools, rule based memo writer, no AI call, labelled on screen. `live` uses Anthropic with `ANTHROPIC_MODEL` (Haiku), capped by `ANALYST_RUNS_PER_HOUR`, and falls back to mock when the cap is hit | **The entrant's Anthropic credit is low. Ask before any live run** |
| Transaction Search only | Transaction Search first. If it has no rows yet (3 hour or more lag), the seeded orders are read directly with the Orders API by order ID | Still live PayPal reads. The evidence source column says which path was used |

## 2. Seeding (PRD 11)
Script `scripts/seed/seed.mjs`. Log in `scripts/seed/SEED_LOG.md`. Public order and capture IDs are in `scripts/seed/seeded-orders.json`, which is committed. The saved account IDs are in `scripts/seed/.seed-state.json`, which is git ignored.
- **Larkspur.** 14 Ridgeline orders ($16,100) and 40 café sales ($18,400). Done.
- **Second Shot.** 9 Ridgeline orders ($10,350). Done. Its funder saved account is done, and it is used for the Flow C open order.
- **Second Shot café sales: not seeded yet.** The Second Shot app still returns 403 on setup tokens (stale token permissions, the same as S1 this morning). Retry with `node --env-file=.env scripts/seed/seed.mjs link secondshot walkin`, approve as the walk in account, then run `finish secondshot walkin` and `sales secondshot`.
- **Accounts.** Walk in is `walkinbuyer.termsheet@example.com` (Personal). Second Shot is `secondshot.termsheet@example.com` (Business), with REST app "Second Shot Cafe".

## 3. Not done yet
- Deploy to Render. Set the env vars there, plus `SEED_VAULT_FUNDER_SECONDSHOT`, which the hosted app needs to re-arm Second Shot on reset.
- Webhooks on the hosted URL (`FUNDER_WEBHOOK_ID`, `SUPPLIER_WEBHOOK_ID`).
- Larkspur invoices with reminders (factor PB). They currently score "none on file".
- P1 and P2 items, Devpost text, video script, statistics checks, three rehearsals.
- Visual polish.

## 4. Safety rule on the entrant's PC
The Claude Code hook `~/.claude/hooks/guard-env.js` blocks reading `.env`. It only becomes active after Claude Code restarts. The allowed command is `node --env-file=.env scripts/(spikes|seed)/<name>.mjs`, with up to 3 word arguments.
