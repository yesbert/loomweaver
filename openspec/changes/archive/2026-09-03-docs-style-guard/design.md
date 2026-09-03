## Context

The audit named three measurable faults; the fourth rule, condition first, cannot be measured and
stays a rule. The repository already runs ratchet checkers (`check-structure.mjs`,
`check-import-cycles.mjs`, `check-comments.mjs`), so the shape of a guard and of its baseline is
settled and a new one should look the same.

## Goals / Non-Goals

**Goals:** a rule a contributor can read in a minute; a guard that keeps the long-sentence count from
growing and keeps the header and the spelling absolute; no false alarm on the shared header, on code,
on tables or on lists.

**Non-Goals:** no prose linter with a dictionary (Vale was considered and rejected: one more tool
chain for three rules); no rewrite of every page in this change; no rule on dashes in the checker,
because the existing pages carry hundreds in headings and tables where they are fine, and telling a
joint from a heading needs a reader.

## Decisions

**Sentences are measured on prose only.** Code fences, tables, headings, the shared header block and
HTML comments are removed; inline code counts as one word however long, a link as its text; a list item
is a paragraph of its own; blockquote markers are stripped. A sentence ends at `.`, `!` or `?` followed
by whitespace and a capital, an asterisk, a quote or a bracket. This misses a sentence that ends in a
colon before a code block and counts it with its neighbour; that is accepted, because such a sentence
is usually the long one anyway.

**Forty words.** The audit's sample stopped being readable in one pass around there; the standing
advice in plain-language guides is 20 to 25 on average, so forty is a ceiling, not a target.

**The baseline is per page and two-directional.** A page may not gain long sentences; a page that lost
some fails until the baseline is rewritten, so the improvement is recorded and cannot slip back. This is
the pattern `structure-baseline.json` uses, for the same reason.

**Three pages are exempt from the header by name.** `docs/README.md`, `docs/glossary.md` and
`docs/reference/operations.md` are maps and notes, not guides; they state no platform behaviour.

**Spelling variants are a short list.** `plug-in`, `side bar`, `work space`, `tool bar`, `sub route`
against the glossary's one-word or hyphenated forms. The list grows when a variant is found, not in
anticipation.

## Risks / Trade-offs

- [The checker flags a sentence that is long for a reason] → the baseline records it; the check only
  refuses growth. Nothing has to be shortened to pass.
- [A page is edited and its count rises by one] → the message names the page and prints the sentences,
  so the fix is visible without running anything else.
- [The rewrite step is forgotten after shortening] → the check fails and says to write the baseline.
