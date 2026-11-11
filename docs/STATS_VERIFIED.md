# Statistics verified at source

PRD rule: no number goes into the app, the write up or the video until it is recorded here with the exact quote from the original source.

## S-01. Small businesses owed money on unpaid invoices (used on the home page hero)

- **Claim used.** "56% of US small businesses are owed money on unpaid invoices, $17,500 on average."
- **Source.** Intuit QuickBooks, *Small Business Late Payments Report 2025*. https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2025/
- **Exact quotes (checked 11 Nov 2026).**
  - "over half (56%) of small businesses surveyed reported being owed money from unpaid invoices"
  - "averaging $17.5K per business"
  - "US small businesses with outstanding invoices are currently owed more than $17,000 each on average"
- **Method.** "The findings in this analysis are based on the January 2025 survey of 2,487 US small businesses with 0-100 employees." This is an online survey of business owners, not an audit of company ledgers.
- **Caveats.**
  - The $17,500 average is per business that is owed money, not per small business overall.
  - This is a vendor survey (Intuit). Cite it as a survey.

## S-02. PayPal's own merchant loan losses (used in the loss-rate argument, Devpost Potential Impact)

- **Claim used.** "PayPal's own merchant loan book lost about 8% a year net in the first half of 2026 ($75M net charge-offs on a $1.9B pool). Spread over 30 days that is about 0.65% to 0.73% per order, below our 1% per-order assumption."
- **Source.** PayPal Holdings, Form 10-Q for the quarter ended 30 June 2026, note "Loans and Interest Receivable", Merchant Receivables. https://www.sec.gov/Archives/edgar/data/1633917/000163391726000082/R19.htm (full filing: https://www.sec.gov/Archives/edgar/data/0001633917/000163391726000082/pypl-20260630.htm)
- **Exact figures (checked 12 Nov 2026 at the filing).**
  - "the total outstanding balance in our pool of merchant loans, advances, and fees receivable was $1.9 billion"
  - 89.6% of the balance current ("within 29 days of the expected repayment date")
  - Six months to 30 June 2026: gross charge-offs $84 million, recoveries $9 million (net $75 million, our subtraction)
- **Our arithmetic.** Net: $75M × 2 / $1.9B = 7.9% a year; × 30/365 = 0.65% per 30 days. Gross: $84M × 2 / $1.9B = 8.8% a year; × 30/365 = 0.73%.
- **Caveats.**
  - The note states no net charge-off rate. The 7.6% figure in earlier research notes was not found in the filing and is not used.
  - The pool is unsecured working-capital credit to sellers, repaid over months, not 30-day trade credit. Scaling an annual rate to 30 days assumes losses build evenly over time. Use it as a sense check, not as a forecast.
  - Annualising one half-year doubles it; the true annual figure may differ.

## Checked but not used
- **Federal Reserve Small Business Credit Survey, 2025 report on employer firms.** Secondary sources say 51% of small employer firms cited uneven cash flow. The figure was not confirmed at the primary PDF, so it is not used.
- **Atradius Payment Practices Barometer, US 2024.** Search summaries say 46% of US B2B sales are made on credit, with terms of about 30 days. The page fetched did not show the figure, so it is not used.
