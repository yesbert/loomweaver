## Context

See `proposal.md` — Why for the motivation. The constraints that shape the approach:

- A command today carries an identity, a translated title, an optional icon, an optional shortcut, an
  optional access requirement and two quiet flags (`paletteHidden`, `popout`). Its behaviour takes an
  optional menu context and answers nothing. Nothing can trigger it except the workbench.
- Every trigger already runs through one execution seam, which is where access gating, refusal
  reporting, failure handling and the detached-window rule live. That seam is the asset this change
  builds on; a second path would destroy the property the change exists to keep.
- A plugin may be in the application's own process or behind a sandbox boundary, and sees the same
  context either way. Anything added to that context must therefore work when it is data crossing a
  boundary, not only when it is a call in the same heap.
- The platform carries no domain vocabulary. The near-term consumer is an agent frontend speaking
  AG-UI, but AG-UI is at version 0.0.x and its event set is still growing. Nothing about it may
  appear in the platform, and no package under the platform may depend on it.

## Goals / Non-Goals

**Goals:**

- Give a command the shape an automated caller needs: described arguments, an answer, and an
  explanation aimed at something choosing between actions.
- Make the set of commands reachable by such a caller derivable from the workbench itself, so no
  consumer keeps a parallel registry.
- Keep one answer to "may this run", the one the user can already see and revoke.
- Stay additive: every command registered today keeps working, unchanged, with no new fields.

**Non-Goals:**

- No transport, no streaming, no cancellation, no long-running invocation. A command answers once.
- No general remote-procedure channel between plugins. The command registry is the only surface
  opened; a plugin still cannot reach another plugin's arbitrary functions.
- No brokered outbound channel for a product's backend. That is separate work, needed only when an
  isolated plugin must reach a service that requires a session.
- No AG-UI mapping. That lives in a separate published package outside the platform's guaranteed
  contract, alongside the existing scaffolding server rather than inside the core.
- No nested or recursive argument shapes in this cut.

## Decisions

### A typed argument descriptor of our own, not JSON Schema

Arguments are declared with a small typed descriptor in the plugin contract: a name, one of a fixed
set of value kinds, a required flag, and a description. The kinds are deliberately few — text,
number, boolean, and a choice from a fixed list — plus a list of any of those.

*Why not JSON Schema.* It would be the obvious shortcut, since that is what a consumer eventually
needs. It is rejected because the platform would then own a specification it does not control, in an
open-world format where every consumer supports a different subset, and because a free-form schema
object turns every typo into a silent no-op. A closed set of kinds makes a wrong declaration a
compile error.

*Why not a validation library.* The contract package ships types only and is framework-neutral;
adding a runtime schema library to it would be a library choice inside the published contract, and
would bind every consumer to that library's major version.

The consumer-side package that speaks a wire protocol converts the descriptor to whatever that
protocol wants. That conversion is a small pure function and it is the right place for it, because it
can follow the protocol's own churn without touching anything guaranteed.

### Openness to a foreign caller is an explicit flag, defaulting to closed

A command declares that a caller other than its own plugin may invoke it. Absent the declaration, it
cannot be reached that way and does not appear in any list.

This follows the precedent already set by the detached-window flag, and for the same reason recorded
there: a command *missing* from an automated caller's reach is a small annoyance, while one that does
something surprising when something other than the user triggered it is the larger failure, and the
workbench cannot tell the two apart for a command it did not write.

*Alternative rejected:* opt-out, with a flag to withhold. It would make every command written before
this change silently reachable the moment the capability is granted, which is the opposite of how
every other permission in the platform behaves.

### One capability, named for what it enables rather than what it touches

Invoking a command the plugin does not own needs a granted capability. Registering commands stays
where it is, under the contributions capability, because that is a contribution.

The capability is therefore named for automation rather than for commands: a slice called "commands"
would sit ambiguously beside registration, and the permissions surface has to be readable by a user
deciding whether to withdraw it. What it says is that the plugin may run actions other plugins
contributed.

### One predicate, two callers

The narrowing that decides whether an invocation is refused and the narrowing that produces the list
are the same code, called from two places. This is the whole reason the change is worth making, and a
scenario pins it: a command absent from the list is refused when invoked, and one present in it runs.
Two independently written filters would drift, and the drift would be a permission leak in one
direction and an unusable list in the other.

### Refusal does not distinguish "not permitted" from "unknown"

A caller without the grant is refused identically whether the command exists or not, so that probing
cannot enumerate what is installed. A caller holding the grant still cannot see a command that did
not declare itself open, for the same reason.

Refusal and failure remain distinguishable from each other, because a caller has to be able to tell
"you may not" from "it broke", and neither may be presented as an answer.

### Descriptions are resolved before they leave the workbench

A description may be a translation key or a literal, consistent with how surface titles already work.
The workbench resolves it to the active language before handing it to a caller, because a caller
outside the application has no access to the translation bundles and a raw key is useless to it.

### Arguments and answers are constrained to data at the seam

Both are validated at the one execution seam, before the sandbox hop outward and after it inward, and
a value that cannot be carried as data is refused rather than silently degraded. This holds for
in-process plugins too, so that a command does not behave differently depending on where its caller
happens to live.

Validation checks the declaration, not the meaning: a command still validates its own inputs. The
declared shape is a contract for discovery, not a security boundary.

## Risks / Trade-offs

- **The published contract grows on a type every plugin already uses.** → Everything added is
  optional. A command registered today compiles and behaves identically, and gains nothing it did not
  ask for.
- **The list and the seam drift apart, and the list becomes a wider account than the truth.** → One
  predicate for both, and a scenario that pins the equivalence rather than testing each side alone.
- **A closed set of argument kinds will be too small for someone.** → It is additive to widen later,
  and impossible to narrow. Starting small is the reversible direction. Recorded as an open question
  below rather than guessed at now.
- **Invocation can recurse: a command invokes a command that invokes the first.** → The seam caps
  invocation depth and refuses beyond it, in the same way a refusal is already reported.
- **A granted plugin can drive the application without the user watching.** → The grant is coarse,
  visible in the permissions surface, revocable at once, and it reaches only commands that declared
  themselves open and that the session already qualifies for. Nothing becomes reachable that the user
  could not have triggered themselves.
- **The descriptor is shaped by what a wire protocol wants today.** → The kinds chosen are the ones
  any caller needs, not the ones one protocol names. The mapping to a protocol lives outside the
  platform, so the platform never has to move when that protocol does.

## Migration Plan

Additive throughout; there is nothing to migrate and no rollback beyond not shipping it. What has to
follow the code, in the same change:

1. The permissions surface lists the added capability, so a user can see and withdraw it.
2. The scaffolding templates and generators emit the new fields in place, so a newly generated plugin
   does not retrofit them.
3. A plugin-author guide covers the chain end to end: declaring arguments, describing the action,
   opening it to a foreign caller, and what the user then sees and can revoke. The published contract
   carries the reasoning for the quiet default in its own documentation, as the detached-window flag
   already does.

## Open Questions

- Whether an argument ever needs a nested object rather than a flat list of values. Deferrable: it is
  additive, no requirement changes, and the answer will come from the first real consumer rather than
  from speculation.
