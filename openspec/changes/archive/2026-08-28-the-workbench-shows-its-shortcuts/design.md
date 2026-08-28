## Context

See `proposal.md` — Why.

Three facts about the current state shape the approach.

The two searches are one component in two modes. The command search and the search over open work
are the same palette rendered with different data; only the seeded command that opens it differs
(`shell.commandPalette` on `mod+k`, `shell.quickOpen` on `mod+p`). A second entry point is therefore
a second trigger, not a second surface.

The existing entry point already adapts to where it is placed. It reads the bar context and renders
compact in a bottom-docked bar, because a bottom bar takes the height of its tallest item and a
badge sized for the top bar would grow it at the cost of the content area. That work is done; the
status bar is a placement the component already handles.

Removal already works at every layer except the badge. Keybindings are derived from the
omit-filtered command signal, so dropping a command drops its chord with it, and the command service
refuses an unregistered or inaccessible id. Only the badge is unconditional: it consults its command
solely for the chord to print, so an omitted command leaves a control that shows nothing and does
nothing. That is the defect the specs delta closes.

## Goals / Non-Goals

**Goals:**

- One shared entry-point component serving both searches, parameterised rather than duplicated.
- A generated distribution that shows both chords on first run.
- Removal that stays whole: dropping a search, or gating it behind a session requirement, takes its
  badge with it.

**Non-Goals:**

- Changing where the existing command-search entry point defaults to. It stays in the top bar, at
  the same slot and order, so no distribution that already opts into it sees a move.
- A feature switch for the entry points. They are contributions, addressed by id and removed with
  the distribution's omit list, which is the established tool for exactly this. A gesture switch
  would be the wrong instrument and the gesture specs say so.
- User-rebindable shortcuts. Rebinding by the end user is deferred platform-wide and this change
  does not open it; what it documents is rebinding by the *distribution*, at composition time.
- Making the scaffold's choice mandatory. What the generator emits is the consumer's code.

## Decisions

**Two sibling providers over one parameterised provider.** The published surface gains a second
provider for the search over open work, mirroring the existing one's options shape (target bar, slot,
order), rather than one provider taking a discriminator or one call placing both.

Why: they are two contributions with two ids, two default placements and two independent
lifetimes. A distribution routinely wants one and not the other, and a single call that places both
would need an opt-out per side, which is a worse surface than two calls. The ids are also the omit
handles, so one provider placing two contributions would hide from the reader that there are two
things to omit.

Alternatives rejected. *One provider with a mode argument* — the caller then writes the same
provider twice with different arguments, which is two calls with a discriminator rather than two
named calls, and reads worse at the composition root. *One provider placing both by default* —
takes the decision away from exactly the distribution that wants only one, and makes "place the
quick-open badge somewhere else" a partial override rather than a plain call.

**The component is shared, the providers are not.** The existing entry-point component is
generalised to take the command it opens, along with the icon and label to render for it, and both
providers bind it. Duplicating a second near-identical component would leave two places to keep the
compact-in-a-bottom-bar behaviour, the tooltip and the accessible name in step.

**The badge follows the command, using the seam that already decides reachability.** The component
resolves its command from the registry's visible commands and asks the command service whether it is
available, which is the same seam a keybinding, a menu entry and a palette row already pass through.
It renders nothing when the command is absent or unavailable. This is deliberately *not* a separate
check: routing it through the existing availability seam is what makes the badge agree with every
other trigger reactively, including when a session changes mid-run.

The shortcut layer is the stated exception, and it falls out of the existing behaviour rather than
needing a case: with shortcuts off, the chord lookup already answers with nothing while the command
stays registered and available, so the badge renders without a chord. That is the correct outcome
and the spec states it as the limit of the guarantee.

**Default placement: command search in the top bar, search over open work in the status bar at the
leading edge.** The status bar's only default occupant sits at its trailing edge, so the leading
edge is free and the two badges cannot be read as a pair of duplicates. This is the owner's call,
recorded here because the alternative was live: a second badge beside the first in the top bar,
rejected as two lookalike controls in the busiest strip of the chrome.

**The scaffold emits both calls into the generated composition root**, where the consumer can see
and delete them, rather than the shell defaulting them on. Turning them on by default in the shell
would change every existing distribution's chrome without asking, which is the opposite of the
platform's rule that a product composes what it shows.

## Risks / Trade-offs

**A distribution that already omits `shell.commandPalette` and opts into the badge is currently
seeing a dead control; after this change the control disappears.** → That is the fix, not a
regression, but it is a visible change for anyone who had worked around it by styling the dead badge
away. It is documented in the change and the badge remains opt-in either way.

**Generalising the entry-point component touches a component on the published contract's rendering
path.** → Its inputs are internal to the shell; the published surface is the providers, and those
keep their shape. The existing provider's defaults do not move, so a consumer who upgrades and
changes nothing sees no difference.

**Two badges is more chrome than some products want.** → Both are opt-in, both carry their own omit
id, and the generated code is the consumer's to delete. The generated notes say so explicitly rather
than leaving it to be discovered.

**The status bar is a region a distribution may not declare.** → A contribution targeting a region
the layout omits renders nothing and says nothing, which is existing platform behaviour and already
called out in the generated layout's own comment. The scaffolded layout declares both bars, so the
generated case is covered; a hand-written layout without a status bar simply does not show the
second badge, exactly as it does not show the version today.

## Open Questions

None. The one design question that was open — whether to add a sibling provider or to parameterise
the existing one — is decided above, and the placement question was decided by the owner.
