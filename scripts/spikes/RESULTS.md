# Sandbox spike results

Written by the scripts in this folder. Emails are masked. No secrets.

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
      "vault_id": "7x1984862c1507812"
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
      "vault_id": "7x1984862c1507812"
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
      "vault_id": "7x1984862c1507812"
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
