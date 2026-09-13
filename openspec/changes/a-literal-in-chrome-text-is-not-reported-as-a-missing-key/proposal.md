> **Status:** approved.

## Why

The contract invites a literal wherever chrome text is declared: a bar button's label and tooltip,
a menu entry's name, a command's title and its descriptions, a menu heading's name and second line,
a launcher entry's title all read "translation key or literal". The workbench renders every one of
them through the translation layer, and once a language bundle has loaded it reports every string
that bundle does not know as a missing key. So every literal the contract invites is reported as a
mistake, on every draw, in development: a language control whose label is the code `DE` and whose
entries are `Deutsch` and `English`, or an account heading that carries the person's name.

NextPA found this building its language control (finding F-018) after the workbench started
answering the served languages, which is exactly the case where the strings are names rather than
keys. The warnings change nothing a user sees; what they cost is the diagnostic itself, because a
console that warns about every literal is a console nobody reads, and a genuinely misspelt key
drowns in it.

## What Changes

- A string that does not have the shape of a key is treated as a literal and is not reported
  missing: it is shown as it is, silently. A key has dot-separated segments of word characters, at
  least one dot and no whitespace, which is the shape every key in the workbench and in every
  contributed bundle has, because a contributed bundle is nested under its own name.
- A string that has that shape and is not in the loaded bundle is still reported, as before.
- The brief and the i18n guide say what counts as a literal.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `i18n`: the requirement *A key is not reported missing while nothing is loaded* says when a
  missing key is reported. A requirement is added beside it saying what is not a key in the first
  place, so that a literal is never reported.

## Impact

- `platform/libs/core/shell/src/lib/i18n/missing-translation-handler.ts` decides what to report and
  is the one place the rule lives; its spec pins it.
- `llms-full.txt` and `docs/weaver/i18n.md` state the rule beside "key or literal", so a plugin
  author knows which strings are safe as literals.
- NextPA's `loomweaver-findings.md` marks F-018 fixed once a release carries this; that happens in
  a NextPA session, not here.

No legacy source is dissolved by this change.
