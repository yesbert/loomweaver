> **Status:** proposed — not approved for implementation yet.

## Why

Release 0.14.0 gave a product three things it decides for itself: a badge beside a tab's title, a
container child it can leave out, and an ad-hoc menu whose labels are keys. The demo runs on 0.14.0
and shows none of them, so a visitor cannot see them and the difference between leaving a child out
and the padlock the demo already shows is invisible. The owner chose four places for them on
2026-09-24.

## What Changes

- **A quote tab carries its status.** Opening a quote gives its tab a badge with the quote's status,
  worded by the keys the list already uses and in the list's tones: a draft neutral, a sent quote in
  the brand colour, an accepted one in success, a declined one in danger, an expired one neutral.
- **The margin can be left out.** The quotes plugin gets a settings section with one toggle, "Show
  margin analysis", on by default. Switched off, the margin child is left out of every open quote:
  no tab, no padlock, and the customer pane takes its room. Switched on, it returns where it stood.
  Next to the padlock the same child shows a sales account today, this shows the difference between
  a product's decision and a session's role.
- **The quotes list has a context menu.** A right-click on a row opens a menu with "Open", "Open as
  preview" and "New quote for this customer". Its labels are translation keys, so an open menu
  changes its words with the language.
- **The payment matching tab counts what is open.** The sandboxed payments surface carries a badge
  with the number of items still open. The view publishes the count through the plugin's state, the
  plugin frame sets the badge, and it goes when nothing is left open. It shows a badge set live from
  a plugin that runs isolated from the page.
- The demo's README describes the four, and each has an end-to-end test in the demo's suite.

## Capabilities

### New Capabilities

None. The demo uses what the platform already guarantees.

### Modified Capabilities

None. The change sets `skip_specs`, because nothing the platform guarantees changes.

## Impact

- `demo/src/quotes`: the quotes plugin (settings section, badge on opening, the margin toggle), the
  list view (context menu), their translations and unit tests.
- `demo/public/payments`: `plugin.js` (watches the count and sets the badge) and `view.js`
  (publishes the count).
- `demo/e2e`: one test per slice.
- `demo/README.md`.
- The demo's initial bundle, which has a recorded ceiling.
- No legacy source is dissolved.
