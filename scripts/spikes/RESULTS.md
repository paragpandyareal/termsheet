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
