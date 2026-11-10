# PayPal AI Hackathon entries. Start here

This repo holds the research and the build briefs for two entries to the PayPal AI Hackathon on Devpost. **No app code exists yet.** This file tells a new developer or AI model exactly where things stand and what to do next.

Last updated Tuesday 10 Nov 2026, 22.00 UTC.

## 1. The situation in 60 seconds

| Item | Detail |
|---|---|
| Deadline | **Thursday 12 Nov 2026, 20.00 UTC** (12.00pm Pacific. Friday 13 Nov, 7.00am Melbourne) |
| Who | One entrant in Melbourne, working with an AI coding model |
| Entry 1 | **TermSheet.** Net 30 for business buyers inside PayPal checkout, with an AI credit analyst. Build this first and finish it fully |
| Entry 2 | **Everyone Goes.** School and club money through PayPal invoices, with private sponsor funded help. Build only if time allows |
| Entry 2, alternative | **Blindfold.** Attack Mode for PayPal card forms. Bots testing stolen cards get no answer. A full PRD exists. Pick this or Everyone Goes as the second entry, not both unless time allows |
| What is done | Research, three rounds of judging, refinements, and a full PRD for all three ideas |
| What is done, 11 Nov | Sandbox tests S1 to S4. See "Current state" below and `scripts/spikes/RESULTS.md` |
| What is not done | Tests S5 to S8, all app code, hosting, statistics checks, Devpost text, video |

## 1b. Current state (11 Nov 2026). Read this before building

| Test | Result | Lock the build to |
|---|---|---|
| S1 save account without purchase | **FAIL.** `/v3/vault/setup-tokens` returns 403 NOT_AUTHORIZED. The app token has no vault payment token scope even with "Save payment methods" ticked | **Fallback passes.** Save during a $1 deposit order with `attributes.vault.store_in_vault: ON_SUCCESS` (PRD 6.7). Retry the setup token once PayPal applies the feature, it is the nicer demo |
| S2 buyer absent charge, business payer | **PASS.** COMPLETED at create | PRD 6.4 as written |
| S3 test decline | **PASS with method C,** with both intent AUTHORIZE and intent CAPTURE. A returned 403, B did not apply | Mock header on order create. Label SIMULATED DECLINE |
| S4 payout to supplier | **PASS.** Batch and item SUCCESS by polling | PRD 6.5. Webhook not yet tested (no public address) |

Sandbox setup that now exists (US, all Business). TermSheet Funding `funder@termsheet.example.com` with REST app "TermSheet Funding". Ridgeline Roasters `ridgeline.termsheet@example.com`. Larkspur Café `larkspur.termsheet@example.com`. Second Shot, Northgate, Pier 9 and the walk in account are not made yet. Ridgeline and Larkspur have no REST apps yet.

Full record of this session for checking by another tool. `docs/SESSION_LOG_2026-11-11.md`.

How to run the spikes. Secrets live in `.env` at the repo root (git ignored). Run `node --env-file=.env scripts/spikes/<name>.mjs`. The saved vault ID lives in `scripts/spikes/.state.json` (git ignored). `scopes.mjs` lists which permissions the funder app has.

Next step. Report to the entrant, then seed history (PRD 11), then build in PRD 13 order.

## 2. What to read, in order

| Order | File | Why |
|---|---|---|
| 1 | This file | Current state and next steps |
| 1a | `docs/SESSION_LOG_2026-11-11.md` | What was set up and tested on 11 Nov, with every PayPal debug ID |
| 2 | `docs/PRD_TermSheet.md` | **The build brief for entry 1. This is the source of truth** |
| 3 | `docs/PRD_EveryoneGoes.md` | The build brief for entry 2 |
| 3b | `docs/PRD_Blindfold.md` | The build brief for the alternative entry 2. Section 1.8 compares the two |
| 4 | `research/scope_check.md` | The 15 checks every entry must pass |
| 5 | `research/brief.md` | Official rules, judging criteria, prizes, what the sandbox can and cannot do |
| 6 | `research/judge_final_A.md`, `judge_final_B.md`, `judge_final_C.md` | What the final judges liked, doubted and asked to fix |
| 7 | `STATUS.md` | Summary of the research result |
| Background only | Everything else in `research/` | Earlier rounds, the competitor survey (`census.md`), the fact check (`redteam_r2.md`) |

**If the PRDs and the research disagree, the PRDs win.** They are newer and include every judge fix. Known differences.
- `research/final_termsheet.md` says the test decline header goes on order create. **Spike S3 on 11 Nov proved this works** (method C). Use method C, see PRD section 6.6.
- The TermSheet PRD adds reading each café's own PayPal sales, a money strip, a locked backtest and a reordered video.
- The Everyone Goes PRD removes the "payday on the 28th" moment and adds a sponsor joining on camera.
- The Blindfold PRD widens the pitch to every small PayPal card merchant, drops the forced security check from the main plan, and publishes no working card testing tool.

## 3. Branches

| Branch | Contents |
|---|---|
| `main` in github.com/paragpandyareal/termsheet (private) | **Work here from 11 Nov.** Same history as the old branch |
| `claude/paypal-hackathon-termsheet-skt5o9` in Paypalai | Old home, kept as a backup. Research plus `docs/` plus this README |
| `ccr-2774405b-ccejof` | Original research only. Already included in the branch above |

Make the termsheet repo public before submitting. Do not open a pull request unless the entrant asks.

## 4. What the entrant must supply before any build

**Update 11 Nov.** The funder account, Ridgeline, Larkspur and the TermSheet Funding REST app now exist (see section 1b). Everything else below is still to do. Ask for secrets through a secure form or environment settings. **Never ask for secrets in chat and never commit them.**

### 4.1 PayPal sandbox setup (developer.paypal.com, Testing Tools, Sandbox Accounts)
All accounts must be **US** sandbox accounts. Full tables are in PRD section 5.3.

For TermSheet.

| Account | Type | REST app needed | Features to switch on in the app |
|---|---|---|---|
| TermSheet Funding | Business | Yes | Vault, Payouts, Invoicing, Transaction Search |
| Ridgeline Roasters | Business | Yes | Vault, Invoicing, Transaction Search, Disputes |
| Larkspur Café | Business | Yes | Vault, Transaction Search |
| Second Shot Café | Business | Yes | Vault, Transaction Search |
| Northgate Resale LLC | Business | Optional | Transaction Search |
| Pier 9 Deli | Business | No | |
| Walk in customers | Personal | No | |

Give the funder, buyer and walk in accounts large starting balances. For each REST app the build needs the client ID and secret. For each account it needs the sandbox email and password (these are safe to publish in the product README, and judges need them).

### 4.2 Other items
- An AI API key (the PRDs assume the Anthropic API) and a spending cap for the public demo.
- A hosting account that gives a public HTTPS address. The PRDs assume Render.
- For entry 2, a second public GitHub repository.
- If Blindfold is built, one more US business sandbox account with a REST app that has advanced card payments and Invoicing switched on, plus two personal accounts (PRD section 5.3).

## 5. Next steps for whoever picks this up

Do these in order. Details are in `docs/PRD_TermSheet.md`.

1. **Confirm the open decisions in section 6 with the entrant.** Do not block on them. Use the stated defaults if there is no answer.
2. **Get credentials** (section 4).
3. **Run the riskiest sandbox tests first** (PRD section 12, tests S1 to S7) and write results to `scripts/spikes/RESULTS.md`. The three that matter most.
   - Charging a saved PayPal account with the buyer absent, with a business account as payer.
   - The test decline, using an AUTHORIZE order with the mock response on the authorise or capture step.
   - Payouts.
4. **Report to the entrant which tests pass** before building anything else. Lock the build to what passes and label every fallback.
5. **Start seeding sandbox history straight after tests S1 and S2 pass** (PRD section 11). Transaction Search can lag 3 hours or more.
6. **Build in the order in PRD section 13.** P0 first, then P1, then P2.
7. **Verify every statistic at its original source** (PRD section 18) and record the quote in `docs/STATS_VERIFIED.md`. No number goes in the write up or video until this is done.
8. **Write the deliverables.** Product README, `LICENSE` (already added, MIT), `docs/DEVPOST.md` with the five judging criteria as headings, `docs/VIDEO_SCRIPT.md`.
9. **Run three full rehearsals on the hosted build**, then hand the entrant the script to record and upload the video.
10. **Only then** consider entry 2. Everyone Goes needs at least 14 hours. Blindfold needs at least 20.

When the product README is written, move this file to `docs/HANDOVER.md`.

## 6. Open decisions

| # | Question | Default if no answer |
|---|---|---|
| 1 | Who records the opening line and voiceover. A person on camera or a still image with voiceover | Still image with voiceover |
| 2 | Are four café REST apps acceptable to set up | Read café sales for Larkspur and Second Shot only |
| 3 | Which AI key and model, and what spending cap for judge mode | Anthropic API, model from env, 30 analyst runs an hour |
| 4 | Is entry 2 Everyone Goes or Blindfold | Everyone Goes, since it reuses the same PayPal building blocks and is quicker to build. Blindfold has zero overlap with TermSheet but needs a whole new stack |
| 5 | Name of the second public repo for entry 2 | Ask before starting entry 2 |
| 6 | Does this repo become the public TermSheet repo, or is a fresh one created | Use this repo and make it public before submitting |

## 7. Working rules

- **Stay inside the 15 scope checks** in `research/scope_check.md`.
- **Only PayPal plus AI.** No other payment rail, no crypto.
- **Sandbox only.** Every dollar on screen must be a real PayPal sandbox transaction with a stored PayPal ID.
- **Be honest on screen.** Label anything seeded, simulated or assumed. Never describe a fallback as the real thing.
- **No secrets in git.** Client secrets and API keys live in environment variables. Sandbox buyer logins may go in the product README.
- **No third party brands or copyrighted music** in the app or video. Fictional businesses only.
- **Never call the option "Pay in 30 days".** It is "Net 30 for Business (concept)".
- **Check layouts by screenshot** at 390, 1280 and 1440 px wide. Nothing may overlap or clip.
- **Commit and push after every working step.**
- **The entrant's writing style.** Simple language, no em dashes, and statistics always checked at source.

## 8. Submission checklist (official rules)

- [ ] Working build that judges can run, by hosted link or by repo instructions
- [ ] Public open source repo with a licence file visible in the About section
- [ ] Sandbox test logins in the README
- [ ] Text description with headings matching the five judging criteria
- [ ] List of AI tools used and how
- [ ] Demo video under 3 minutes, public on YouTube, no third party marks or music
- [ ] Project works exactly as the video and text show
- [ ] If two entries are submitted, they are clearly different from each other

Judging criteria, equally weighted, with ties broken in this order. Technological Implementation, Design, Potential Impact, Innovation/Idea, Presentation.

## 9. Repo map

```
README.md                    this handover
LICENSE                      MIT
STATUS.md                    research summary and ranking
docs/PRD_TermSheet.md        build brief, entry 1
docs/PRD_EveryoneGoes.md     build brief, entry 2
docs/PRD_Blindfold.md        build brief, alternative entry 2
research/                    rules, ideas, three rounds of judging, final specs, scope checks
```
