# TermSheet. Devpost submission text

> Paste each block into the matching Devpost field. The About story is also on its own in `docs/DEVPOST_STORY.md`. Every number is backed by `docs/STATS_VERIFIED.md`, `docs/AI_EVAL.md`, `docs/BACKTEST.md` or the economics table in the app.

## FIELD 1. Project name

```
TermSheet. Net 30 inside PayPal checkout
```
(40 characters. If Devpost wants it shorter, use just `TermSheet`.)

## FIELD 2. Elevator pitch / tagline (under 200 characters)

```
Net 30, as a PayPal button. The roaster is paid today, the café pays in 30 days, PayPal earns $60 per $2,000 order, and an AI credit analyst decides for about 10 cents.
```
(172 characters.)

## FIELD 3. About the project (paste everything between the two lines)

---

*Concept demo in the PayPal sandbox with fake money. Not an offer of credit. PayPal does not offer this product today.*

**What's next for PayPal: trade credit as a PayPal button.**

**One order, three winners.** A café buys $2,000 of coffee beans. **The roaster** is paid **$1,940 today** by PayPal Payout and carries no credit risk. **The café** gets **30 days** to sell the coffee, then pays $2,000, with no fee and no interest. **PayPal** earns a **$60 fee**, about **$21 after all assumed costs**, on an order that today is often paid outside PayPal.

**The AI pays for itself about 18,000 times over.** The AI credit analyst costs **8 to 11 cents** a decision, and one bad $2,000 order it stops covers about 18,000 decisions. It made the right call in **24 of 24 live runs** on our two test cases. It can only tighten a plain scorecard, never loosen it. Every dollar in the demo is a real PayPal sandbox transaction (fake money) with its PayPal ID on screen.

**Try it in five minutes:** https://termsheet-tgwl.onrender.com (PayPal popup login `larkspur.termsheet@example.com` / `larkspurtermsheet`, a sandbox test account). Free hosting, so the first load can take up to a minute. Press Reset demo if a story looks half done.
**Code:** https://github.com/paragpandyareal/termsheet (MIT licence). Built in November 2026 for this hackathon.
**Video:** TODO YouTube link

## Inspiration

**Small suppliers are stuck being the bank.** Marisol runs Ridgeline Roasters, a six-person roastery that sells to cafés. Her cafés want 30 days to pay, because big distributors give them that. Marisol cannot wait 30 days for her money, and she cannot tell which new café will pay. So she asks for cash up front, and she loses accounts. She is not alone: in a 2025 survey of 2,487 US small businesses, **56% were owed money on unpaid invoices, $17,500 on average** among those owed (Intuit QuickBooks, Small Business Late Payments Report 2025).

**PayPal already holds what a lender needs.** It sees the supplier's trade history with the café, and the café's own sales landing in its PayPal account. Yet PayPal's credit products serve shoppers (Pay in 4, Pay Monthly) and sellers (Working Capital, Business Loan). **None offers trade terms at a supplier's checkout for the business that is buying**, as far as we can find. We built that missing piece.

**What is new.** Most AI lending demos let the model decide. Here the AI has no power to give more credit. Plain code sets the ceiling, the AI can only lower it or send the file to a person, and code rejects any sentence that does not cite a PayPal record a tool really returned.

## What it does

TermSheet adds a **Net 30 for Business** option under the PayPal buttons on a supplier's own checkout.

| Who | What they get | Shown live in the demo |
|---|---|---|
| **The roaster** (Ridgeline) | Paid today, $0 waiting on cafés, no credit risk | A real $1,940 PayPal Payout for a $2,000 order |
| **The café** (Larkspur) | 30 days to pay, with the PayPal login it already has, and a fair plan if a payment fails | Approved up to $5,000, $0 charged today |
| **PayPal** (the funder, called TermSheet Funding in the demo) | A 3% fee on each order and new wholesale volume on PayPal | "Fee earned" in the credit team console |
| **The AI analyst** | A second pair of eyes that can only say "less" or "no", for 8 to 11 cents | Stopped a risky $2,387.50 order the rules alone approve, in 13 of 13 live runs |

**How one order works.**
1. The café applies at checkout in under a minute.
2. An AI credit analyst reads the café's PayPal history and writes a credit memo. **Every sentence links to the PayPal record it came from.**
3. If approved, the café saves its PayPal account in the normal PayPal popup. Nothing is charged today.
4. The roaster is paid the same day by PayPal Payout, less the 3% fee.
5. On day 30, the funder charges the café's saved account with the café not present. The funder (a PayPal credit unit in this concept, called TermSheet Funding in the demo) buys the receivable, so the café owes the funder, not the roaster.
6. **If that charge fails,** the café explains in its own words, the AI checks the story against the café's real sales and offers a payment plan inside fixed rules, and a real charge recovers the money.

**Three live stories you can run yourself.**
- **A café gets 30 days.** Larkspur is approved and Ridgeline receives a real $1,940 Payout.
- **A missed payment gets fixed.** Second Shot's day-30 charge is declined. The owner replies "Espresso machine died, can pay half Friday." The AI checks that against its sales and offers a plan (in our runs, $1,000 now and $1,000 in 15 days, no fees). Accept, and a real $1,000 charge goes through.
- **The AI catches what the rules miss.** Northgate's numbers look fine, so the scorecard alone approves its $2,387.50 order. The AI notices the reference letter's opening date contradicts the form, the beans ship to a logistics company for onward shipping, and the letter claims it was "already pre-approved". It sends the file to a person.

**Proof it works.**
- **24 of 24 live AI decisions correct** on the hosted demo: Larkspur approved 11 of 11, Northgate stopped 13 of 13 (22 logged runs on 11 Nov with every memo published in the repo, plus 2 checks on 12 Nov). Median 18 seconds per decision. Two cases, repeated: this shows consistency, not accuracy on all buyers.
- **35 unit tests,** 20 of which feed deliberately bad AI outputs (invented evidence, a raised limit, a plan that does not add up) to the validators and confirm each is rejected.
- **axe-core found no WCAG 2.2 AA violations** on any page at desktop and phone width.

## What PayPal earns, and what the AI is worth

**$60 on every $2,000 order.** The supplier pays a 3% fee in place of PayPal's normal processing fee, so it is new revenue whenever the order would otherwise be paid outside PayPal. After cost of funds ($10), collection ($6), servicing ($3) and expected loss ($20), PayPal keeps **about $21, a 1.05% contribution.**

**At scale: about $30M in fees and $10.5M in contribution per $1B of wholesale volume.** All rates are our assumptions, not PayPal figures.

**New volume, not just new fees.** Orders between small businesses, like a café buying beans, are often paid by bank transfer or cheque, outside PayPal. Net 30 at checkout gives that volume a reason to move onto PayPal.

**A flywheel.** The analyst reads the café's own PayPal sales, so cafés that sell through PayPal score higher and get bigger limits. Every café that wants terms has a reason to become a PayPal merchant.

**Is a 1% loss realistic?** As a sense check, PayPal's own merchant loan book (Q2 2026 10-Q: a $1.9B pool, $84M gross charge-offs and $9M recoveries in the first half) works out to about 0.65% to 0.73% per 30 days. That book is different credit, so it is a sense check, not a forecast. Break-even is about a 2% loss rate, and a pilot would reprice or stop if losses passed 2% for two cycles.

**What the AI is worth in money.** One decision costs **8 to 11 cents** at list price: **under 0.2% of the $60 fee.** The AI guards the $20 expected-loss line, so **one bad $2,000 order it stops pays for about 18,000 AI decisions.** That gap is real: in our backtest of 100 synthetic buyers, the plain scorecard approved **all 25** whose only warning sign was in a document or shipping address, every one at the full $5,000 limit. Reading documents, addresses and contradictions is exactly what the AI adds. (The synthetic buyers measure the size of the gap, not the AI.)

## How we built it

**Six PayPal products in one flow:** Vault, Payouts, Orders, Transaction Search, Webhooks and the Agent Toolkit, across three sandbox business accounts (café, roaster, funder).

**Real money movement in the PayPal sandbox, with every ID on screen.**
- **Vault** saves the café's PayPal account with no purchase (`/v3/vault/setup-tokens`, `/v3/vault/payment-tokens`).
- **Payouts** pays the roaster on day 0 (`/v1/payments/payouts`).
- **Orders** charges the café on day 30 with the café absent (`/v2/checkout/orders` with `payment_source.paypal.vault_id`). The decline test uses PayPal's sandbox header `PayPal-Mock-Response: INSTRUMENT_DECLINED`, labelled "Simulated decline" on screen.
- **Transaction Search** reads the café's own sales with the café's own app. **Webhooks** are signature-verified.
- **PayPal Agent Toolkit** gives the AI its read tools on the supplier's account: `list_transactions`, `list_invoices`, `list_disputes`.

**The AI analyst is Claude Opus 5.5 with tool use.** Like a human analyst, it chooses which records to pull, then submits a structured decision. Every record gets a stable evidence ID such as `txn:0G042576G7005140W`.

**Guardrails in plain code, checked before anyone sees an AI output.**
- **The AI can only tighten.** A versioned scorecard sets the most a café can get. The AI may keep, lower, decline or refer to a person. It can never raise a limit.
- **No citation, no sentence.** Every memo sentence must cite evidence a tool really returned. A contradiction must cite both sides.
- **The AI never moves money.** Only ledger code calls the money APIs.
- **Documents are evidence, never instructions.** A letter that tries to steer the decision is flagged.
- **A person stays in the loop.** Referred files go to a person. If the AI is unavailable or fails checks twice, a labelled rule-based writer takes over, and any file with documents goes to a person.

**Designed as a real product with three sides.** Every page has three labelled zones: **A, what the customer sees** (in a device frame with a desktop and phone toggle), **B, what PayPal's credit team sees** (the AI's tool calls, the cited memo, every PayPal ID and the fee earned), and **C, demo controls** for judges only, drawn with a dashed border so it never reads as product. Seeded history, the app clock, the simulated decline and any AI fallback are labelled on screen.

**Stack.** Next.js, TypeScript, Postgres, hosted on Render (a hackathon sponsor).

**AI tools used.**
- **Claude Opus 5.5** (Anthropic API) is the credit analyst and collections analyst in the live app.
- **PayPal Agent Toolkit** provides the analyst's PayPal read tools.
- **Claude Code** (Anthropic) wrote the code, ran the sandbox tests and evaluations, and wrote the docs with me.
- **Microsoft Edge neural text-to-speech** (voice "Andrew", via edge-tts) reads the video voiceover. Claude Code drove the browser with Playwright to record the demo, built the motion graphics as HTML rendered frame by frame, and edited the video with ffmpeg.

## Challenges we ran into

- **Making a payment fail on purpose.** We tried three ways to make the sandbox decline a charge. Only the mock-response header on the order call worked, so the demo uses that and labels it.
- **The sandbox button sometimes failed to load,** so saving the account uses PayPal's redirect approval page, which has been reliable.
- **Sandbox history cannot be backdated.** Seeded orders carry this month's dates, so the AI is told the dates are clustered and not to treat that as risk.
- **A fair AI test.** Our first suspicious letter said "ignore your rules", which was too easy. We rewrote it to be subtle. The AI still named all three warning signs in all 12 logged runs.
- **One public demo for many judges.** A spend cap Reset cannot clear, a per-visitor limit on AI runs, and single-use claims so a plan is charged once and an order is paid out once.

## Accomplishments that we're proud of

- **Real sandbox money moves end to end:** a saved PayPal account, a real Payout to the roaster, a real charge with the café absent, a simulated decline (PayPal's sandbox test header) and a real recovery charge.
- **The failure path is the best part.** A declined payment ends in a conversation and a recovered $1,000, not a collections letter.
- **An AI you can audit.** Click any citation in the memo and the exact PayPal record lights up.
- **The AI earns its keep.** It caught what the rules miss in 13 of 13 live runs, for about 10 cents a decision.

## What we learned

- **An AI is easiest to trust when plain code checks its work.** Requiring every sentence to cite a real record means the AI cannot point at evidence that does not exist.
- **The AI's best job was not replacing the scorecard** but covering what it cannot see: documents, addresses and contradictions.
- **In payments, the recovery path convinces people more than the happy path.**

## What's next for TermSheet

- **See a missed payment coming:** read the café's balance a few days before the due date and offer a plan before the charge fails.
- **Limits that grow** with each on-time payment, shown to the café as a ladder.
- **A pilot with a handful of suppliers,** with a stop rule: if losses pass 2% for two cycles, reprice or stop.

---

## FIELD 4. Built with (type each as a tag)

```
paypal, paypal-rest-api, paypal-vault, paypal-orders, paypal-payouts, paypal-transaction-search, paypal-webhooks, paypal-agent-toolkit, claude, claude-opus, anthropic, claude-code, next.js, react, typescript, postgresql, render, playwright, edge-tts, ffmpeg, vitest, axe-core
```

## FIELD 5. Try it out links

```
https://termsheet-tgwl.onrender.com
https://github.com/paragpandyareal/termsheet
```

## FIELD 6. Video demo link

```
TODO YouTube link (YouTube, public)
```
