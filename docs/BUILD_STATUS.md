# Build status. Read this first

Last updated Wednesday 11 Nov 2026, 15.30 Sydney (04.30 UTC). Deadline Thursday 12 Nov 2026, 20.00 UTC.

## 0. Where things stand
- **Phases 1 to 4 of PRD 13 are built and pushed to `main`** of the private repo github.com/paragpandyareal/termsheet. Phase 5 (README, judge mode) is in progress. `npm run build` passes. **Deployed at 14.20 Sydney to https://termsheet-tgwl.onrender.com** (Render free web service plus free Postgres, from `render.yaml`). The keys were copied to Render by `scripts/seed/render-env.mjs`, which prints names only. PayPal webhooks are made by `scripts/seed/webhooks.mjs` (funder `8F925359EA092550F`, supplier `1AC71676XW3261817`). Hosted check at 14.25: reset armed Second Shot (real Payout), and Larkspur was approved $5,000 with 23 evidence rows. The hosted analyst runs in practice mode (`ANALYST_MODE=mock` in render.yaml) to protect the Anthropic credit.
- **The entrant tested the local app at 14.07 and says it works.** Visual polish is deferred until the features are complete.
- **Tested against the sandbox.**
  - Larkspur applies and the analyst approves $5,000 with 23 cited evidence rows. The account is saved and Ridgeline gets a $1,940 Payout.
  - Second Shot's day 30 charge gives INSTRUMENT_DECLINED (method C, debug `f3394068dd74c`). The limit drops to $1,000, the café replies, and a plan is proposed. Accepting it makes a real $1,000 capture (debug `ca589e8e4fd0d`).
- **Unit tests.** `npm test` runs 8 tests on the scorecard, policy box and limit rules. All pass.

## 0b. Since 14.30 (for reviewers)
- **Two independent reviews were run by separate agents** (UI/UX and AI quality). Their findings were applied in commits 33e7346 and 345fbcd.
- **The AI changes in response:**
  - Tools return real invoice, dispute and daily-sales rows to the model.
  - `get_policy` gathers any missing ceiling facts in code.
  - Stronger validators: whole numbers, two-sided contradictions, and plan amounts must match the message.
  - `tightened_from_scorecard` is computed in code.
  - A labelled automatic fallback runs when the AI call fails.
  - Hourly and daily caps are stored in the database (30 and 300).
  - New `summary`, `tightening_reason` and `would_change` fields.
  - A story check card on the café phone.
- **First live AI run** (hosted, Northgate, claude-haiku-5-5). It declined with both contradictions and ignored the injection. It used about 30k input and 2.8k output tokens. The first submit failed validation because the model sent arrays as strings; the run retried and passed. The model output is now normalised.
- **Design.** PayPal-aligned tokens (navy #001C64, blue #0070E0, no logo), a 4/8/12/16/32 spacing scale, a type scale, and one hero per page. See `app/globals.css`.
- **Decided 15.31.** The hosted judge demo runs `ANALYST_MODE=live` (claude-haiku-5-5), capped at 30 runs an hour and 300 a day, with the labelled fallback.

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
- **Second Shot café sales.** 30 sales ($11,000). Done at 14.52, after the Second Shot app permissions caught up.
- **Invoices** (`scripts/seed/invoices.mjs`). 2 for Larkspur ($840, $1,265) and 1 for Second Shot ($970). Each was sent, reminded twice, then recorded as paid late (PRD fallback, so nobody pays by hand). The PB factor counts late invoices over all billed orders plus invoices, so Larkspur is 2 of 16 and scores 80, tier A.
- **Accounts.** Walk in is `walkinbuyer.termsheet@example.com` (Personal). Second Shot is `secondshot.termsheet@example.com` (Business), with REST app "Second Shot Cafe".

## 3. Not done yet
- Check that a real webhook event arrives and verifies on the hosted app (Funder ledger, webhook log).
- P1 and P2 items, Devpost text, video script, statistics checks, three rehearsals.
- Visual polish.

## 4. Safety rule on the entrant's PC
The Claude Code hook `~/.claude/hooks/guard-env.js` blocks reading `.env`. It only becomes active after Claude Code restarts. The allowed command is `node --env-file=.env scripts/(spikes|seed)/<name>.mjs`, with up to 3 word arguments.
