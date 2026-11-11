# Sandbox spike results

Written by the scripts in this folder. Emails and saved account (vault) IDs are masked. No secrets.

## S1 step 1 (create setup token). FAIL
Run at 2026-11-10T22:41:05.197Z

- `POST /v3/vault/setup-tokens` -> **403**, debug ID `ca588900678c1`
  <details><summary>sent</summary>

```json
{
  "payment_source": {
    "paypal": {
      "description": "Net 30 for Business (concept). Charged on each order's due date, up to your limit.",
      "usage_type": "MERCHANT",
      "customer_type": "BUSINESS",
      "permit_multiple_payment_tokens": false,
      "experience_context": {
        "brand_name": "TermSheet Funding",
        "shipping_preference": "NO_SHIPPING",
        "return_url": "https://example.com/apply/return",
        "cancel_url": "https://example.com/apply/cancel"
      }
    }
  }
}
```
</details>
  <details><summary>response</summary>

```json
{
  "name": "NOT_AUTHORIZED",
  "debug_id": "ca588900678c1",
  "message": "Authorization failed due to insufficient permissions.",
  "details": [
    {
      "issue": "NOT_AUTHORIZED",
      "description": "Authorization failed due to insufficient permissions."
    }
  ]
}
```
</details>

## S1 step 1 (create setup token). FAIL
Run at 2026-11-10T22:47:41.837Z

- `POST /v3/vault/setup-tokens` -> **403**, debug ID `ca58899b50a43`
  <details><summary>sent</summary>

```json
{
  "payment_source": {
    "paypal": {
      "description": "Net 30 for Business (concept). Charged on each order's due date, up to your limit.",
      "usage_type": "MERCHANT",
      "customer_type": "BUSINESS",
      "permit_multiple_payment_tokens": false,
      "experience_context": {
        "brand_name": "TermSheet Funding",
        "shipping_preference": "NO_SHIPPING",
        "return_url": "https://example.com/apply/return",
        "cancel_url": "https://example.com/apply/cancel"
      }
    }
  }
}
```
</details>
  <details><summary>response</summary>

```json
{
  "name": "NOT_AUTHORIZED",
  "debug_id": "ca58899b50a43",
  "message": "Authorization failed due to insufficient permissions.",
  "details": [
    {
      "issue": "NOT_AUTHORIZED",
      "description": "Authorization failed due to insufficient permissions."
    }
  ]
}
```
</details>

## S1 fallback. Save PayPal account during a $1 deposit order. PASS
Run at 2026-11-10T22:55:37.588Z

Vault status VAULTED. Vault ID stored in the git ignored .state.json.

- `POST /v2/checkout/orders` -> **200**, debug ID `ca5889a044a1d`
  <details><summary>sent</summary>

```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "S1F-1794350873639",
      "description": "Net 30 for Business (concept). Deposit",
      "amount": {
        "currency_code": "USD",
        "value": "1.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "attributes": {
        "vault": {
          "store_in_vault": "ON_SUCCESS",
          "usage_type": "MERCHANT",
          "customer_type": "BUSINESS",
          "permit_multiple_payment_tokens": false
        }
      },
      "experience_context": {
        "brand_name": "TermSheet Funding",
        "shipping_preference": "NO_SHIPPING",
        "user_action": "PAY_NOW",
        "return_url": "https://example.com/apply/return",
        "cancel_url": "https://example.com/apply/cancel"
      }
    }
  }
}
```
</details>
- `POST /v2/checkout/orders/03Y16307D3810153H/capture` -> **201**, debug ID `f9295161ffc4e`
  <details><summary>sent</summary>

```json
{}
```
</details>

## S2. Charge vault ID, buyer absent, intent CAPTURE. PASS
Run at 2026-11-10T22:55:48.304Z

Order status COMPLETED, capture status COMPLETED, order 4LY60806B3765842M, capture 22K43434RM1882219.

- `POST /v2/checkout/orders` -> **201**, debug ID `f3935969bd3f6`
  <details><summary>sent</summary>

```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "S2-1794351345074",
      "invoice_id": "TS-S2-1794351345074-1",
      "description": "Net 30 repayment, Ridgeline order SPIKE",
      "amount": {
        "currency_code": "USD",
        "value": "20.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault id masked>"
    }
  }
}
```
</details>

## S3. Test decline. PASS
Run at 2026-11-10T22:56:01.809Z

Method C produced INSTRUMENT_DECLINED. Debug ID of the failed call `f711539b3a81e`. Real authorisations were voided.

- `POST /v2/checkout/orders` -> **201**, debug ID `f68088968f187`
  <details><summary>sent</summary>

```json
{
  "intent": "AUTHORIZE",
  "purchase_units": [
    {
      "reference_id": "S3A-1794351355062",
      "invoice_id": "TS-S3A-1794351355062",
      "amount": {
        "currency_code": "USD",
        "value": "15.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault id masked>"
    }
  }
}
```
</details>
- `POST /v2/payments/authorizations/87R993326S965680S/capture` -> **403**, debug ID `f931528eacd7f`
  - extra headers `{"PayPal-Mock-Response":"{\"mock_application_codes\":\"INSTRUMENT_DECLINED\"}"}`
  <details><summary>sent</summary>

```json
{}
```
</details>
  <details><summary>response</summary>

```json
null
```
</details>
- `POST /v2/payments/authorizations/87R993326S965680S/void` -> **200**, debug ID `f3025458f881c`
- `POST /v2/checkout/orders` -> **422**, debug ID `f711539b3a81e`
  - extra headers `{"PayPal-Mock-Response":"{\"mock_application_codes\":\"INSTRUMENT_DECLINED\"}"}`
  <details><summary>sent</summary>

```json
{
  "intent": "AUTHORIZE",
  "purchase_units": [
    {
      "reference_id": "S3C-1794351361044",
      "invoice_id": "TS-S3C-1794351361044",
      "amount": {
        "currency_code": "USD",
        "value": "15.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault id masked>"
    }
  }
}
```
</details>
  <details><summary>response</summary>

```json
{
  "name": "UNPROCESSABLE_ENTITY",
  "details": [
    {
      "issue": "INSTRUMENT_DECLINED",
      "description": "The instrument presented  was either declined by the processor or bank, or it can't be used for this payment."
    }
  ],
  "message": "The requested action could not be performed, semantically incorrect, or failed business validation.",
  "debug_id": "70c28ae654da",
  "links": [
    {
      "href": "https://developer.paypal.com/api/rest/reference/orders/v2/errors/#INSTRUMENT_DECLINED",
      "rel": "information_link",
      "method": "GET"
    }
  ]
}
```
</details>

Note on S3. Method A, the mock header on authorisation capture, returned 403 with an empty body (debug `f931528eacd7f`), so that route is closed for this app. Method B did not apply, because the AUTHORIZE order with a vault ID was already authorised at create. Method C gave a real INSTRUMENT_DECLINED 422 with no order created, so nothing was left to void. The A authorisation was voided (200). **Lock the build to method C.**

## S4. Payout funder to supplier. PASS
Run at 2026-11-10T22:56:48.260Z

Batch M7TMQ46TR4S5Y ended as SUCCESS, item SUCCESS. Webhook not tested here (no public address yet), polling only.

- `POST /v1/payments/payouts` -> **201**, debug ID `f18712422d610`
  <details><summary>sent</summary>

```json
{
  "sender_batch_header": {
    "sender_batch_id": "TS-PO-S4-1794351378902",
    "email_subject": "TermSheet payout for order SPIKE"
  },
  "items": [
    {
      "recipient_type": "EMAIL",
      "receiver": "<email>",
      "amount": {
        "currency": "USD",
        "value": "19.40"
      },
      "sender_item_id": "TS-POI-S4-1794351378902",
      "note": "Order SPIKE. $20.00 less 3% fee."
    }
  ]
}
```
</details>
- `GET /v1/payments/payouts/M7TMQ46TR4S5Y` -> **200**, debug ID `f1529982e6e54`

## S3 extra. Method C with intent CAPTURE. PASS
Run at 2026-11-10T23:27:29.492Z

Mock header on a CAPTURE order create gives INSTRUMENT_DECLINED. No order created, no money moved.

- `POST /v2/checkout/orders` -> **422**, debug ID `f7866046ff4b4`
  - extra headers `{"PayPal-Mock-Response":"{\"mock_application_codes\":\"INSTRUMENT_DECLINED\"}"}`
  <details><summary>sent</summary>

```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "S3CC-1794353246837",
      "invoice_id": "TS-S3CC-1794353246837",
      "amount": {
        "currency_code": "USD",
        "value": "15.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault id masked>"
    }
  }
}
```
</details>
  <details><summary>response</summary>

```json
{
  "name": "UNPROCESSABLE_ENTITY",
  "details": [
    {
      "issue": "INSTRUMENT_DECLINED",
      "description": "The instrument presented  was either declined by the processor or bank, or it can't be used for this payment."
    }
  ],
  "message": "The requested action could not be performed, semantically incorrect, or failed business validation.",
  "debug_id": "70c28ae654da",
  "links": [
    {
      "href": "https://developer.paypal.com/api/rest/reference/orders/v2/errors/#INSTRUMENT_DECLINED",
      "rel": "information_link",
      "method": "GET"
    }
  ]
}
```
</details>

## Refund of the $1 S1 fallback deposit (verification charge). PASS
Run at 2026-11-10T23:27:43.682Z

Capture 4EM07518CA296962F, refund 18G485739D0474422 status COMPLETED.

- `POST /v2/payments/captures/4EM07518CA296962F/refund` -> **201**, debug ID `f17861065bc81`
  <details><summary>sent</summary>

```json
{
  "note_to_payer": "Refund of the $1.00 account verification charge"
}
```
</details>

## S1. Save PayPal account without purchase. PASS
Run at 2026-11-11T01:27:58.758Z

Vault ID came back and is stored in the git ignored file scripts/spikes/.state.json. payment_source keys returned: paypal.

- `POST /v3/vault/setup-tokens` -> **201**, debug ID `f66980480ff30`
  <details><summary>sent</summary>

```json
{
  "payment_source": {
    "paypal": {
      "description": "Net 30 for Business (concept). Charged on each order's due date, up to your limit.",
      "usage_type": "MERCHANT",
      "customer_type": "BUSINESS",
      "permit_multiple_payment_tokens": false,
      "experience_context": {
        "brand_name": "TermSheet Funding",
        "shipping_preference": "NO_SHIPPING",
        "return_url": "https://example.com/apply/return",
        "cancel_url": "https://example.com/apply/cancel"
      }
    }
  }
}
```
</details>
- `POST /v3/vault/payment-tokens` -> **200**, debug ID `f825872f8efad`
  <details><summary>sent</summary>

```json
{
  "payment_source": {
    "token": {
      "id": "98N27541SR311901L",
      "type": "SETUP_TOKEN"
    }
  }
}
```
</details>

## S2. Charge vault ID, buyer absent, intent CAPTURE. PASS
Run at 2026-11-11T01:28:09.154Z

Order status COMPLETED, capture status COMPLETED, order 1FA19092MJ990710K, capture 90770893SM086721E.

- `POST /v2/checkout/orders` -> **201**, debug ID `f77816880793b`
  <details><summary>sent</summary>

```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "S2-1794360485484",
      "invoice_id": "TS-S2-1794360485484-1",
      "description": "Net 30 repayment, Ridgeline order SPIKE",
      "amount": {
        "currency_code": "USD",
        "value": "20.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault id masked>"
    }
  }
}
```
</details>

## Cleanup. Delete the old fallback saved account (PRD 6.8 close a line). PASS
Run at 2026-11-11T01:28:12.308Z

Delete 204, then read back 404 (404 means gone).

- `DELETE /v3/vault/payment-tokens/<old vault id>` -> **204**, debug ID `f595334d7cd4f`
- `GET /v3/vault/payment-tokens/<old vault id>` -> **404**, debug ID `f35352771bdbb`
  <details><summary>response</summary>

```json
{
  "name": "RESOURCE_NOT_FOUND",
  "message": "The specified resource does not exist.",
  "debug_id": "f35352771bdbb",
  "details": [
    {
      "issue": "TOKEN_NOT_FOUND",
      "description": "The specified token id does not exist."
    }
  ],
  "links": [
    {
      "href": "https://developer.paypal.com/docs/limited-release/payment-tokens/v3/api/#error-INVALID_RESOURCE_ID",
      "method": "GET"
    }
  ]
}
```
</details>

## Correction, 11 Nov 12.36 Sydney

**Correction, 11 Nov 12.36 Sydney.** The entrant found that `larkspur.termsheet@example.com` was created as a **Personal** sandbox account by mistake, not Business. So every S1, S2 and S3 result so far used a **personal payer**. S2 proves buyer absent charging for a personal account only, which is the PRD 12 fallback ("owner's PayPal"). **Charging a business payer is still unproven.** Next step is a new Business Larkspur account, then rerun S1 and S2.

## S1. Save PayPal account without purchase. PASS
Run at 2026-11-11T01:44:35.837Z

Vault ID came back and is stored in the git ignored file scripts/spikes/.state.json. payment_source keys returned: paypal.

- `POST /v3/vault/setup-tokens` -> **201**, debug ID `f27268849f02b`
  <details><summary>sent</summary>

```json
{
  "payment_source": {
    "paypal": {
      "description": "Net 30 for Business (concept). Charged on each order's due date, up to your limit.",
      "usage_type": "MERCHANT",
      "customer_type": "BUSINESS",
      "permit_multiple_payment_tokens": false,
      "experience_context": {
        "brand_name": "TermSheet Funding",
        "shipping_preference": "NO_SHIPPING",
        "return_url": "https://example.com/apply/return",
        "cancel_url": "https://example.com/apply/cancel"
      }
    }
  }
}
```
</details>
- `POST /v3/vault/payment-tokens` -> **201**, debug ID `f434131f90084`
  <details><summary>sent</summary>

```json
{
  "payment_source": {
    "token": {
      "id": "8D24638619860523N",
      "type": "SETUP_TOKEN"
    }
  }
}
```
</details>

## S2. Charge vault ID, buyer absent, intent CAPTURE. PASS
Run at 2026-11-11T01:44:39.527Z

Order status COMPLETED, capture status COMPLETED, order 7LL66346VM5734515, capture 9TG326348T078043C.

- `POST /v2/checkout/orders` -> **201**, debug ID `f201904e51969`
  <details><summary>sent</summary>

```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "S2-1794361475881",
      "invoice_id": "TS-S2-1794361475881-1",
      "description": "Net 30 repayment, Ridgeline order SPIKE",
      "amount": {
        "currency_code": "USD",
        "value": "20.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault id masked>"
    }
  }
}
```
</details>

## S3 extra. Method C with intent CAPTURE. PASS
Run at 2026-11-11T01:44:41.200Z

Mock header on a CAPTURE order create gives INSTRUMENT_DECLINED. No order created, no money moved.

- `POST /v2/checkout/orders` -> **422**, debug ID `f156045203d2d`
  - extra headers `{"PayPal-Mock-Response":"{\"mock_application_codes\":\"INSTRUMENT_DECLINED\"}"}`
  <details><summary>sent</summary>

```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "S3CC-1794361479577",
      "invoice_id": "TS-S3CC-1794361479577",
      "amount": {
        "currency_code": "USD",
        "value": "15.00"
      }
    }
  ],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault id masked>"
    }
  }
}
```
</details>
  <details><summary>response</summary>

```json
{
  "name": "UNPROCESSABLE_ENTITY",
  "details": [
    {
      "issue": "INSTRUMENT_DECLINED",
      "description": "The instrument presented  was either declined by the processor or bank, or it can't be used for this payment."
    }
  ],
  "message": "The requested action could not be performed, semantically incorrect, or failed business validation.",
  "debug_id": "70c28ae654da",
  "links": [
    {
      "href": "https://developer.paypal.com/api/rest/reference/orders/v2/errors/#INSTRUMENT_DECLINED",
      "rel": "information_link",
      "method": "GET"
    }
  ]
}
```
</details>

## Note

**Business payer proven, 11 Nov 12.45 Sydney.** The personal Larkspur account was deleted and `larkspur.termsheet@example.com` was recreated as a **Business** account. On it, S1 no purchase save PASS (payment token debug `f434131f90084`), S2 buyer absent CAPTURE PASS (order `7LL66346VM5734515`, capture `9TG326348T078043C`, debug `f201904e51969`), and S3 method C with CAPTURE PASS (422 INSTRUMENT_DECLINED, debug `f156045203d2d`). Earlier vault IDs belonged to the deleted personal account and are dead.

## S6. Agent Toolkit reads on the supplier app. PASS
Run at 2026-11-11T01:46:31.184Z

@paypal/agent-toolkit 1.11.0, openai export, handleToolCall with sandbox context. list_transactions returned 2 rows for the last 30 days (the S4 payout to Ridgeline is the only expected row so far). list_invoices was also called; no invoices exist yet. The toolkit does not expose PayPal debug IDs.

- `TOOL list_transactions` -> **200**, debug ID `n/a (toolkit hides headers)`
- `TOOL list_invoices` -> **200**, debug ID `n/a (toolkit hides headers)`

## S7. Larkspur reads its own sales with its own app. PASS
Run at 2026-11-11T01:46:32.825Z

Call works: true. Reporting scope on the Larkspur token: true. Rows 1, net 5000.00 USD. **Partial.** No walk in sales are seeded yet, so "totals match seeded sales" cannot be checked until seeding (PRD 11) runs and Transaction Search catches up (3 hours or more).

- `GET /v1/reporting/transactions?<last 30 days>` -> **200**, debug ID `f193197508b78`

Note on S6 and S7. S6 rows were the sandbox opening balance (event T1900) and similar setup rows, not seeded sales yet, but the toolkit read path is proven. S7 is marked PASS above only because the call and the reporting scope work. Treat S7 as **PARTIAL** until seeded walk in sales exist and the totals are compared.

## S5. Two SDK copies on one page. INCONCLUSIVE
Run at 2026-11-11T01:48Z to 01:53Z

Page `scripts/spikes/s5-two-sdk.mjs` (localhost:4455). Both SDK v5 scripts load with namespaces `paypalSupplier` and `paypalFunder`, both `render()` promises resolve, and both containers hold 2 iframes after 5 s with a 45 px slot. **No clash between the two copies was seen.** But the buttons flash and then show blank, in Edge, Chrome and an Edge private window, and the single button pages (`?only=supplier`, `?only=funder`) behave the same. A headless Edge test with PayPal's generic `client-id=sb` also showed a blank button. So the blank buttons are not caused by having two copies. Cause unknown; not yet checked: browser devtools Network tab for the `www.sandbox.paypal.com/smart/buttons` iframe, and a public HTTPS host instead of localhost. No payment was made through the page.

**Fallback that is already proven.** The redirect approval link (`/v3/vault/setup-tokens` then the `approve` link, used in S1) works end to end. The app can use redirects for the save account step if the JS buttons stay blank.

Update 11 Nov 13.03 Sydney. Another AI tool working with the entrant reports the blank button problem was intermittent. Not re-checked by Claude Code. Retest S5 with `node --env-file=.env scripts/spikes/s5-two-sdk.mjs` and http://localhost:4455 before relying on JS buttons.
## S5 follow up. Why the buttons were blank. LIKELY CAUSE FOUND (not the PC)
Checked at 2026-11-11T01:56Z to 02:01Z from a clean cloud Chromium (not the entrant's PC), with PayPal's generic `client-id=sb`. No secrets used.

- The button iframe `https://www.sandbox.paypal.com/smart/buttons?...` **sometimes returns HTTP 500** from PayPal. In 18 page loads between 01:56Z and 01:58Z, 8 got 500 and 10 got 200. In the next 40 loads (01:58Z to 02:01Z) all got 200. So the fault comes in bursts. Sample debug IDs for the 500s: `f119668469c33`, `f82162723bbdd`, `f1826643a7b9f`.
- The 500 body is a tiny page (about 750 bytes, a good one is about 740,000) whose script says `new Error(""__PAYPAL_DOMAIN__ is not defined"")`. That is a fault inside PayPal's sandbox server. The doubled quotes are also a syntax error, so PayPal's own error report never runs.
- This gives the exact S5 symptoms. The yellow placeholder flashes, `render()` resolves, the container keeps 2 iframes with a 45 px slot, `onError` never fires, and the slot is blank. It does not depend on browser, private mode, client ID or one SDK copy versus two.
- When the iframe got 200, the button drew normally on a plain `http://localhost` page. So localhost is not the cause, and the SDK and the S5 page are fine.
- **Not yet confirmed on the entrant's PC.** S5 ran at 01:48Z to 01:53Z, a few minutes before the 500s were seen here. To confirm, open the S5 page, press F12, Network tab, type `smart/buttons` in the filter, reload, and read the Status column. 500 means this fault. 200 with a blank button means something else on the PC.
- `s5-two-sdk.mjs` now has a watchdog. `onInit` only fires when the real button is up. If it has not fired after 8 s the button is closed and drawn again, up to 3 tries, and then the page log names the likely cause. Tested with the saved 500 page: a real load (ready on try 1), a failed first load (ready on try 2) and a permanent failure (message after 3 tries). The app should copy this pattern and keep the redirect approval link as the last fallback.
- S5 itself (a real payment and a real save through the two buttons) is still not completed. Rerun it now that the cause is known.
