# TermSheet: Net 30 for Business, inside PayPal checkout

> Paste each section into the matching Devpost field. Replace the two links marked TODO before you submit.

**Net 30, as a PayPal button. The supplier is paid today, the café pays in 30 days, and an AI credit analyst shows its working.**

- Live demo: https://termsheet-tgwl.onrender.com (PayPal sandbox, fake money)
- Code: https://github.com/paragpandyareal/termsheet (MIT licence)
- Video: TODO YouTube link
- Judge login for the PayPal popup: `larkspur.termsheet@example.com` / `larkspurtermsheet` (sandbox test account)

*Concept demo in the PayPal sandbox. Not an offer of credit. PayPal does not offer this product today.*

---

## The problem

Marisol runs Ridgeline Roasters, a six-person coffee roastery that sells to cafés. Her café customers want 30 days to pay, because big distributors give them that. Marisol cannot wait 30 days for her money, and she has no way to judge whether a new café will pay. So she asks for payment up front, and she loses accounts.

This is common. In a 2025 survey of 2,487 US small businesses, 56% said they were owed money on unpaid invoices, $17,500 on average among those owed (Intuit QuickBooks Small Business Late Payments Report 2025).

## What it does

TermSheet adds a **Net 30 for Business** option under the PayPal buttons on a supplier's checkout page.

1. The café applies in under a minute.
2. An AI credit analyst reads the café's PayPal history and writes a credit memo. Every sentence links to the PayPal record it came from.
3. If approved, the café saves its PayPal account with the funder in the normal PayPal popup. Nothing is charged today.
4. The roaster is paid the same day by PayPal Payout, less a 3% fee.
5. On day 30 the funder charges the café's saved PayPal account, with the café not present.
6. If that charge fails, the café explains in its own words. The AI checks the story against the café's real sales and offers a payment plan inside fixed rules. The café taps Accept, and a real charge goes through.

There are three parties: the **supplier** (Ridgeline), the **buyer** (the café) and the **funder** (TermSheet Funding, a stand-in for a PayPal credit unit). The funder buys the invoice, so the café owes the funder, and that is why the PayPal popup names TermSheet Funding.

---

## Technological Implementation

**Real money movement in the PayPal sandbox.** Nothing on screen is a mockup. Every dollar is a real sandbox call with its PayPal ID shown in the funder ledger.

| Step | PayPal API |
|---|---|
| Save the café's PayPal account with no purchase | `POST /v3/vault/setup-tokens`, then `POST /v3/vault/payment-tokens` (funder's app, redirect approval) |
| Pay the roaster on day 0 | `POST /v1/payments/payouts`, then `GET /v1/payments/payouts/{id}` |
| Charge the café on day 30 with the café absent | `POST /v2/checkout/orders` with `payment_source.paypal.vault_id`, intent CAPTURE |
| Test a failed charge | The same call with PayPal's sandbox header `PayPal-Mock-Response: INSTRUMENT_DECLINED`, labelled "Simulated decline" on screen |
| Normal pay now | `POST /v2/checkout/orders` and `/capture` on the supplier's app |
| Read the café's own sales | `GET /v1/reporting/transactions` on the café's own app |
| Webhooks | `POST /v1/notifications/verify-webhook-signature`, then the ledger updates |
| Analyst read tools | **PayPal Agent Toolkit** (`@paypal/agent-toolkit`): `list_transactions`, `list_invoices`, `list_disputes` on the supplier's account |

Six sandbox accounts (funder, supplier, three cafés and a walk-in shopper), with REST apps for the funder, the supplier and the two cafés that read their own sales. The riskiest calls (saving a business account with no purchase, charging a business buyer who is absent, the decline test, Payouts) were proven in standalone tests before any app code was written. The debug IDs are in `scripts/spikes/RESULTS.md`.

**The AI analyst (Claude Opus 5.5, tool use).**
- It works like a human credit analyst. It decides which tools to call: the application, Ridgeline's history with the buyer (Agent Toolkit), invoices, disputes, the café's own PayPal sales, its repayment record and any uploaded documents. Then it submits a structured decision.
- Every record a tool returns gets a stable evidence ID, such as `txn:0G042576G7005140W` or `sales:larkspur:30d`.
- **Plain code checks every AI output before anyone sees it.** Every memo sentence must cite evidence IDs that a tool really returned. A contradiction must cite both sides. The AI may not go above the scorecard's limit or term, may not approve when the scorecard says no, and an approval must cover the order. A failed check goes back to the AI once, then to a human.
- **The AI can only tighten.** A plain, versioned scorecard (`sc-1`) sets the most the café can get. The AI can keep that, lower it, decline or refer to a human. It can never raise it.
- **The AI never moves money.** Only ledger code calls the money APIs.
- **Documents are evidence, never instructions.** A letter that tries to steer the decision is flagged and ignored.
- **Protected for a shared public demo.** A spend cap that Reset cannot clear, a per-visitor limit on AI runs, and single-use claims so a plan is charged once and an order is paid out once.
- **Safe failure.** If the AI is unavailable, over its spending cap or fails validation twice, a plain rule-based writer drafts the memo from the same live PayPal evidence, and the screen labels it. It does not try to judge documents: any file with documents goes to a person.

**Proof it works.**
- **22 live AI runs** on the hosted demo (`docs/AI_EVAL.md`, with every memo in `docs/ai-eval-runs.json`). Larkspur approved 10 times out of 10. Northgate stopped 12 times out of 12, even though the rules alone would approve it. Median 18 seconds per decision.
- **What the AI costs against what it earns.** About 14k tokens in and 1.3k out per decision: 8 to 11 cents at Claude Opus 5.5 list price, under 0.2% of the $60 fee. It guards the expected-loss line (1% of each order), so one stopped bad $2,000 approval pays for about 18,000 AI decisions.
- **Scorecard backtest** on 100 synthetic buyers (`docs/BACKTEST.md`, free to rerun). The plain scorecard approves all 25 buyers whose only warning sign is in a document or the shipping address. That is the gap the AI covers.
- **33 unit tests.** 20 of them feed hand-made bad AI outputs to the validators (invented evidence, uncited sentences, a raised limit, a plan that does not add up) and confirm each is rejected. 5 more check that without the AI, any file with documents goes to a person.

Stack: Next.js, TypeScript, Postgres, hosted on Render.

## Design

TermSheet is a complete product with three sides, not a single API call.

- **Checkout (the supplier's shop).** A Net 30 card sits under the PayPal buttons. The café applies, watches the analyst's tool calls stream in live, then reads a short memo. Clicking a citation number jumps to the exact evidence row.
- **Café phone.** A phone-sized view of what the café sees: what it owes, when, the failed-charge message, a free-text reply box and the plan to accept.
- **Funder ledger.** Every PayPal order ID, capture ID, Payout batch and debug ID, with the money strip showing who was paid what.
- **The recovery path is designed, not an error screen.** A declined charge freezes the line, cuts the limit, opens a conversation and ends in a real recovery charge.
- **Honesty labels everywhere.** Seeded history, the app clock, the simulated decline and the AI fallback are each labelled on screen.
- **A story bar** on every page shows where the judge is in the three stories, and one money format and one date format are used throughout.
- Built to PayPal's colour guide, checked at desktop and phone widths.

## Potential Impact

**For PayPal, the prize is wholesale volume.** Orders between small businesses, like a café buying beans, are usually paid by bank transfer or cheque against an invoice, outside PayPal. Net 30 at checkout gives those orders a reason to move onto PayPal. PayPal is also in an unusual position to lend safely here, because it sees both sides: the supplier's trade history with the buyer, and the buyer's own sales landing in its PayPal account.

**For the supplier**, it means being paid today and offering terms without carrying the risk. **For the café**, it means 30 days to sell the coffee before paying for it, and a fair plan if something goes wrong.

**Per-order economics** for a $2,000 order. All rates are assumptions, not PayPal figures.

| Line | Rate | Amount |
|---|---|---|
| Fee paid by the supplier | 3.0% | +$60 |
| Cost of funds, 30 days at 6% a year | 0.5% | -$10 |
| Collection cost | 0.3% | -$6 |
| Servicing | 0.15% | -$3 |
| Expected loss | 1.0% | -$20 |
| **Contribution** | **1.05%** | **+$21** |

| Loss rate | Contribution per order |
|---|---|
| 0.5% | +1.55% |
| 1.0% | +1.05% |
| 2.05% | 0 (break even) |
| 3.0% | -0.95% |

The idea works only if losses stay near 2% or lower. Three levers keep them there: small limits that grow with on-time payment, an AI that can only tighten the scorecard, and collection from the same PayPal account the café's sales land in. A pilot would stop or reprice if losses passed 2% for two cycles.

## Innovation/Idea

- **A saved PayPal account used as a repayment method.** The café saves its account once with no purchase, and the funder collects on day 30 with the café not present.
- **Underwriting from both sides of the PayPal network.** The supplier's trade history with the café, read through the PayPal Agent Toolkit, plus the café's own PayPal sales, read with its own app.
- **AI that shows its working.** Every sentence must cite a record a tool actually returned, and plain code checks that before anyone sees it.
- **AI that can only tighten.** The AI adds judgement the rules cannot (a letter that contradicts the form, a shipping address that does not fit a café, an attempt to steer the reviewer), but it cannot loosen a decision.
- **Credit for the business buyer, at checkout.** PayPal Pay in 4 lends to shoppers and PayPal Working Capital lends to sellers. TermSheet is credit for the business that is buying, offered at the supplier's checkout and repaid from the buyer's own PayPal account.
- **A payment plan at the moment of failure.** Instead of a collections letter, the café explains in its own words, the AI checks the story against real sales, and a real charge recovers the money.

## Presentation

- **Video (under 3 minutes):** TODO YouTube link
- **Try it yourself in five minutes** at https://termsheet-tgwl.onrender.com. Three stories, each started from the home page:
  1. **A café gets 30 days.** Larkspur applies for a $2,000 order, the AI approves it, the café saves its PayPal account and Ridgeline gets a $1,940 Payout.
  2. **A missed payment gets fixed.** Second Shot's day 30 charge is declined. The café replies "Espresso machine died, can pay half Friday." The AI checks that against its sales, explains kindly why the first payment has to be today, and offers a plan inside the rules (in our test run, $1,000 now and $1,000 in 15 days). Accept, and a real $1,000 charge goes through.
  3. **The AI catches what the rules miss.** Northgate's numbers look fine, so the rules alone would approve it. The AI spots that its reference letter's opening date contradicts the form, that goods go to a logistics company for onward shipping, and that the letter claims it was "already pre-approved". It sends the file to a human.
- The README has the full walkthrough, the API list and how to run it locally.

## What is real and what is seeded

Every dollar on screen is a real PayPal sandbox transaction: saved account approvals, charges with the buyer absent, and Payouts. The analyst's tool calls read the PayPal sandbox live. Seeded items are the buyers' past history (created this month, because sandbox history cannot be backdated), the app clock and the test decline. All rates are assumptions.

## AI tools used

- **Claude Opus 5.5** (Anthropic API, model `claude-opus-5-5`) is the credit analyst and the collections analyst in the live app, using tool use. Capped at 20 runs an hour and 100 a day.
- **PayPal Agent Toolkit** provides the analyst's read tools on the supplier's PayPal account.
- **Claude Code** (Anthropic) wrote the code, ran the sandbox tests, ran the evaluations and wrote the docs with the entrant.
- **Microsoft Edge neural text-to-speech** (voice "Andrew", via edge-tts) read the video voiceover. Claude Code also drove the browser with Playwright to record the demo.

## Built with

PayPal REST APIs (Vault, Orders, Payouts, Transaction Search, Webhooks), PayPal Agent Toolkit, Claude Opus 5.5, Next.js, TypeScript, Postgres, Render.
