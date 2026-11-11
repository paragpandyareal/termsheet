# Build status. Read this first

Last updated Wednesday 11 Nov 2026, 17.30 Sydney (06.30 UTC).
**Deadline: Thursday 12 Nov 2026, 12:00pm Pacific (20.00 UTC). That is Friday 13 Nov, 7.00am Sydney and Melbourne.**

## 1. Where things stand
- **The app is built, deployed and working.**
  - Live: https://termsheet-tgwl.onrender.com (Render free web service plus free Postgres, from `render.yaml`, auto-deploys on push to `main`).
  - Repo: github.com/paragpandyareal/termsheet, branch `main`. It is still **PRIVATE** until the entrant says to make it public (the rules need it public before submitting). Private research, mock judge scores and the PRDs for other ideas were moved out of the repo to `../TermSheet-private` (they remain in git history, which we do not rewrite).
  - Local copy: `C:\Users\rocks\OneDrive\Desktop\Claude Code\TermSheet`.
- **Live AI is ON for the hosted demo.**
  - `ANALYST_MODE=live`, model `claude-opus-5-5` (effort medium, prompt caching), capped at 20 runs an hour and 100 a day. The cap is counted in the `ai_spend` table, which Reset demo does not touch. About 8 US cents a run.
  - A GitHub Action (`.github/workflows/keep-awake.yml`) pings the site every 10 minutes so the free Render service does not sleep.
  - **Render free Postgres expires 30 days after creation (about 10 Dec 2026).** Upgrade it or move the data if judging runs later than that.
  - If the AI fails or the cap is hit, a labelled rule-based fallback runs.
  - Local `.env` has no `ANALYST_MODE`, so local runs use mock mode (no AI cost).
  - The entrant said on 11 Nov they will top up credit as needed and wanted a better model. Still say before any large batch of live runs.
- **Live reliability check at 16.05 Sydney on the hosted site:**
  - Larkspur: approved for $5,000, 3 runs out of 3.
  - Northgate: the rules alone gave 58/100, tier B (approve $2,500). The AI stopped it and referred it to a human, 2 runs out of 2, because of the founding-year contradiction.
  - Second Shot plan: the AI understood "half Friday" and worked out that $1,000 is about 3 days of sales. It explained why the first payment is taken today. The real $1,000 capture went through.
  - Tokens: about 12k to 16k in and 2k to 3k out per run.
  - The hosted demo was reset afterwards.
- **Independent reviews done** (separate agents and outside reviewers).
  - Findings applied: UI/UX, AI quality, and a full review with two pasted reports.
  - The "AI beats the rules" story (Northgate) and the reliability guards came from them.
- **Design.**
  - PayPal colour guide from the entrant, in `app/globals.css`.
  - Home page redesigned to the entrant's spec: problem-first hero, one button, the money picture, three equal stories, why trust it, and a demo controls drawer.
  - A story step bar on every page.
  - One money format ($2,000) and one date format (12 Nov 2026).

## 2. The three demo stories
1. **Larkspur Café gets 30 days.**
   - /shop, then Apply, then the AI approves $5,000.
   - Save the PayPal account (redirect approval page, login `larkspur.termsheet@example.com` / `larkspurtermsheet`). The card is not charged.
   - Ridgeline gets a $1,940 Payout.
   - The entrant has not personally tested the hosted PayPal login step. Ask them to try it once before recording.
2. **Second Shot recovers.**
   - /buyer/buyer_secondshot, then Jump to next due date. The real charge is declined (sandbox mock header, labelled Simulated decline).
   - The café replies, the AI checks the story against sales and proposes a plan, Accept, then a real $1,000 capture.
3. **The AI catches what the rules miss.**
   - /shop?buyer=northgate, a $2,387.50 order.
   - The rules alone would approve it. The AI stops it (12 of 12 live runs): the letter's opening date 2024 contradicts the form's 2019, goods go to a logistics company for onward shipping, and the letter's "already pre-approved" claim is flagged as an attempt to steer the review.

## 3. Key files
- `README.md`: judge-facing README, with the sandbox login.
- `docs/PRD_TermSheet.md`: product brief.
- `docs/STATS_VERIFIED.md`: the one verified statistic (Intuit QuickBooks 2025: 56% of US small businesses are owed money on unpaid invoices, $17,500 on average), with the exact quotes.
- `docs/SESSION_LOG_2026-11-11.md` and `scripts/spikes/RESULTS.md`: sandbox spike evidence with debug IDs.
- `docs/DEVPOST.md`: the submission write-up. `docs/VIDEO_SCRIPT.md`: the video script.
- Code:
  - `lib/analyst/` holds the AI loop, prompts, tools and validators.
  - `lib/scorecard/` holds the rules and tests.
  - `lib/ledger/` holds the money flows.
  - `lib/paypal/` holds the REST calls.
  - `app/` holds the pages and API.
  - `components/money.tsx` holds shared UI, formats and the step bar.
  - `app/globals.css` holds the design tokens.
- Scripts (run as `node --env-file=.env scripts/seed/<name>.mjs ...`):
  - `seed.mjs`: seed history; run `status` to see what exists.
  - `invoices.mjs`: seeded late invoices.
  - `render-env.mjs push`: copy `.env` keys to Render.
  - `render-set.mjs <setting> <value> [nodeploy]`: analyst_mode, analyst_runs_per_hour, analyst_runs_per_day, anthropic_model, anthropic_effort.
  - `webhooks.mjs`.
  - `scripts/spikes/check-env.mjs`: shows which keys are set without showing the values.
- Evidence: `docs/AI_EVAL.md` (22 live Opus runs: Larkspur 10/10 approved, Northgate 12/12 stopped; `node scripts/eval/live-eval.mjs <larkspur> <northgate>` costs credit), `docs/BACKTEST.md` (`node scripts/backtest/backtest.mts`, free).
- Tests: `npm test` (28 unit tests: 8 scorecard, 20 validator). Type check: `npx tsc --noEmit`. Local app: `npm run dev`, then http://localhost:3000.

## 4. Sandbox accounts (all US)

| Role | Email | Type | REST app |
|---|---|---|---|
| Funder | funder@termsheet.example.com | Business | TermSheet Funding |
| Supplier | ridgeline.termsheet@example.com | Business | Ridgeline Roasters |
| Buyer | larkspur.termsheet@example.com (pw `larkspurtermsheet`) | Business | Larkspur Cafe |
| Buyer | secondshot.termsheet@example.com | Business | Second Shot Cafe |
| Buyer | northgateresale@example.com | Business | none |
| Walk in | walkinbuyer.termsheet@example.com | Personal | none |

**Seeded history.**
- Larkspur: 14 Ridgeline orders ($16,100), 40 café sales ($18,400) and 2 late invoices.
- Second Shot: 9 Ridgeline orders ($10,350), 30 café sales ($11,000) and 1 late invoice.
- Northgate: 8 Ridgeline orders ($14,400).

## 5. Deliberate deviations from the PRD
- **Database.** Plain SQL on Postgres (hosted) or PGlite (local, in `%LOCALAPPDATA%/termsheet-pg`, because PGlite fails inside OneDrive) instead of Prisma plus Docker.
- **Evidence grid.** A plain table, not AG Grid.
- **Saving the account.** It uses PayPal's redirect approval page, not the JS button. The sandbox button iframe sometimes returns 500 (S5).
- **Decisions.** Only APPROVE, DECLINE or REFER. No deposits or counteroffers, because there is no deposit flow. An approval must cover the order.
- **The AI tightens only for risks the scorecard can't see.** The scorecard already prices history, late invoices, disputes, order size and repayment.
- **Seeded-data note.** Sandbox dates cannot be backdated, so the tools and prompt tell the model that seeded dates are clustered. The 7-day sales figure is estimated from the 30-day average when dates are clustered.
- **The PB factor** counts late invoices over all billed orders plus invoices.

## 6. What is left, in order
Done on 11 Nov afternoon: outside-review fixes (spend cap, shared-demo notes, keep-awake, impact line, phone nav, validator tests, Next 15.5.29, research moved out), Opus 5.5 upgrade, subtler Northgate letter, backtest, live eval, `docs/DEVPOST.md`, `docs/VIDEO_SCRIPT.md`.
1. Funder sandbox balance is fine (about $82,500 on the dashboard, 11 Nov). The balances API lags by hours, so `scripts/spikes/funder-balance.mjs` can show an old figure; trust the dashboard.
   Final independent review done 11 Nov 17.10; fixes applied. Open item from it: cleaning git history before going public needs the entrant's yes.
2. **The entrant tests the hosted Larkspur PayPal login once**, then records the video from `docs/VIDEO_SCRIPT.md` and uploads it to YouTube.
3. **Paste `docs/DEVPOST.md` into Devpost** and add the YouTube link (two TODOs). Add screenshots.
4. **Make the repo public, only when the entrant says so.** Run a secret scan first (`.env`, `.seed-state.json` and `.state.json` are git ignored and have never been committed).
5. Optional: the proactive "see the missed payment coming" version of story 2.

## 7. Working rules for the next session
- The entrant is non-technical. Use simple language, no em dashes, step-by-step click instructions, and explain what you need and why.
- Never ask for secrets in chat. They live in `.env`, and the entrant edits it in Notepad: Desktop, then Claude Code, then TermSheet, then `.env`.
- A Claude Code hook (`~/.claude/hooks/guard-env.js`) blocks reading `.env`. Only `node --env-file=.env scripts/(spikes|seed)/<name>.mjs` with up to 3 word arguments is allowed.
- Commit and push after every working step. Do not rewrite git history.
- Check layouts by screenshot with headless Edge (`--headless=new --screenshot`, wrapped in `timeout 60`).
- Any statistic must be checked at its source and recorded in `docs/STATS_VERIFIED.md`.
- Pitfall: in this Bash tool, `\\` collapses to `\` and heredocs can break. Write code files with the Write or Edit tools. Avoid JS `String.replace` with replacement text containing `$'` or `$&`; use the Edit tool.
