## Context

See proposal.md, *Why*. The missing-key handler is one class, installed for the whole application
by the shell's providers, that Transloco calls with the key it could not resolve. It already holds
one rule from the specification: stay silent until a bundle for the active language has loaded. It
returns the key as the rendered text, which is what makes a literal work at all.

Every key the workbench looks up is dotted. The shell's own bundles are nested objects, so a leaf
is reached as `settings.general.title`. A contributed bundle is nested under the name the
distribution declared it with, so even a bundle whose own top-level keys are single words is
reached as `product.tagline` or `agent.title`; checked across the shell, the testbed weaver and the
demo's seven bundles, every lookup site writes the dotted form. An overlay that rewords the shell
mirrors the shell's keys and is dotted for the same reason.

Content routes and container handles already carry an explicit `titleIsLiteral`, because a tab's
title is persisted and has to be told apart after a restart, where no lookup happens. That is a
different problem from this one and stays as it is.

## Goals / Non-Goals

**Goals:**

- A literal the contract invites is never reported, and a misspelt key still is.
- One rule, in one place, stated in the specification so nobody looks for a switch.

**Non-Goals:**

- A marker on each of the eight contribution fields that accept a literal. See the first decision.
- Changing how a tab's persisted title is told apart; `titleIsLiteral` stays.
- Making the diagnostic switchable. The existing requirement forbids it, for a reason that still
  holds.

## Decisions

**Tell a literal apart by shape, not by a marker.** The alternative is a flag beside every field
that says "key or literal": eight fields across five contracts, each with its own JSDoc, and every
plugin author having to remember to set it, which they will not until the warning teaches them,
which is the warning this change removes. The shape rule needs nothing from the author and covers
every case the finding names. What it cannot cover is a literal that looks like a key, which is
rare, and the specification names it as the limit rather than hiding it.

**The shape is dot-separated word segments.** Not merely "contains a dot": an address like
`n@example.com` or a sentence ending in a full stop would then count as a key. Segments of word
characters joined by dots, at least one dot, no whitespace. A single word such as `save` is a
literal under this rule, and that is safe here because no key is ever looked up as a single word:
the workbench nests its own bundles and every contributed one.

**The rule lives in the handler, not in each renderer.** Transloco calls the handler for every
unresolved key from every pipe and directive, so one decision there reaches every chrome text at
once. Filtering at the call sites would need each of the eight to know the rule.

## Risks / Trade-offs

- A key misspelt into a single word, `title` instead of `notes.title`, is now silent. → A
  single-word key cannot resolve anywhere in this platform today either, so what the author sees
  is the same raw string as before; only the console line is gone. Stated in the guide.
- A later change that flattens a contributed bundle to top-level keys would make real keys silent.
  → The requirement *A contributed bundle is nested under its own name* forbids that, and this
  requirement names its dependence on it.
