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
