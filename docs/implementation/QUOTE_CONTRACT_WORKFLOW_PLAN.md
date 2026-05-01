# BizPrint Quote and Smart Contract Workflow Plan

## Purpose

Define the final business workflow from price calculation to contract signing and order conversion.

## Canonical workflow

```text
Customer input / AI analysis
→ QuoteEngine calculates price
→ Quote saved
→ PDF proposal generated
→ Quote sent (email/link)
→ Customer opens quote
→ Customer accepts quote
→ Contract generated
→ Customer signs contract
→ Contract locked
→ Quote converts to order
→ Payment and production start
```

## Key modules

### Quote Delivery

Responsibilities:
- send quote
- generate secure public link
- track open/accept status

Entity:

```ts
QuoteDelivery {
  id
  quote_id
  recipient_email
  public_token_hash
  status
  sent_at
  opened_at
  accepted_at
  expires_at
}
```

### Contract

Responsibilities:
- generate contract from quote
- manage terms
- capture signature
- attach stamp

Entity:

```ts
Contract {
  id
  quote_id
  status
  pdf_url
  signed_pdf_url
  company_stamp_url
  customer_signature
  signed_at
}
```

## Public pages

```text
/q/[token] → quote view
/contracts/[token] → contract sign
```

## Security

- token must be hashed
- token must expire
- do not expose raw IDs
- store signature audit trail (IP, timestamp)

## UX requirements

Quote page must include:
- company info
- quote number
- product breakdown
- price breakdown (subtotal, VAT, total)
- lead time
- accept button

Contract page must include:
- terms
- confirmation checkbox
- signature input
- timestamp

## Acceptance criteria

- quote can be sent and opened via secure link
- customer can accept quote
- contract is generated
- contract can be signed
- signed contract is stored
- quote converts to order
