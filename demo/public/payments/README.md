# Payment matching

Reads the day's incoming bank payments and holds each one against the open receivables, so a bookkeeper sees at a glance which payments settle an invoice and which do not.

## What it shows

Every statement line carries the customer, the amount and the reference the payer typed. Beside it the plugin states what it found:

- **Amounts agree** — the payment settles the receivable it points at.
- **Amounts differ** — a receivable was found, but not for this amount. A part payment, a deduction,
  or a mistake.
- **No match** — nothing in the open items answers to this reference.

Confirming a line books the match. Dismissing it leaves the payment for someone who knows more.

## What it is allowed to do

It contributes its own view and reads whether someone is signed in, so it can say who confirmed a match. It reaches nothing else: no storage of this application, no session token, no other plugin. It runs in its own sandbox, in a document of its own, and speaks to the workbench only through the protocol the workbench offers it.

## Settings

The plugin carries its own settings, grouped apart from the product's own. The tolerance decides how far an amount may sit from the receivable and still count as agreeing, which is what turns a payment short by a cent from a problem into a match. 