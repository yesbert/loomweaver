> **Status:** approved.

## Why

The `commands` capability says that every trigger runs its command through one place "so that access
rules, failure reporting and the record of what was used cannot differ by route". Two of those three
are true. The third is not: the record is written in exactly one place, when the user chooses a
command from the search, and no other route adds to it. A keyboard shortcut, a rail item, a bar
button, a menu entry and an invocation by identity all leave it untouched.

So the contract guarantees something the workbench does not do, and has since the record was
introduced. That is the defect this change fixes, and it is worth fixing precisely because nobody
noticed: a requirement nobody can rely on teaches the next reader that the others might be like it
too.

It surfaced while folding a different change into this capability. That change wanted to say an
invocation nobody chose does not join the record — true of the implementation, and in plain conflict
with the sentence above. Rather than let one requirement contradict its neighbour, the sentence was
left alone and the conflict written down. This is where it gets settled.

## What Changes

- The requirement about the one execution seam stops claiming anything about the record. What the
  seam genuinely makes uniform is access gating, the rule about a window showing a single piece of
  work, and failure reporting.
- The requirement about the search states who writes the record and who does not: it is written when
  the user picks a command **from the search**, and no other trigger adds to it. That is what makes
  the list a memory of what the user reached for in that particular place, rather than a usage
  counter.
- Nothing about the behaviour changes. This corrects what is guaranteed, not what happens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: the requirement covering the one execution seam no longer claims the record of what was
  used is uniform across routes; the requirement covering the search states that the record is
  written when the user chooses a command there and by no other trigger.

## Impact

- `openspec/specs/commands/spec.md` — two requirements reworded. No other capability makes a claim
  about the record.
- No source change. The implementation already behaves as the corrected requirements describe, and a
  test pins it so the correction cannot quietly become untrue again.
- `docs/reference/host-services.md` and `docs/authoring-a-weaver.md` where they describe the palette's
  recently-used list, if either implies a wider record than the corrected requirement states.
- No legacy source is dissolved by this change.
