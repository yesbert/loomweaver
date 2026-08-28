## Context

See `proposal.md` — Why. What the workbench has today, and what it does not:

- **Two mechanisms that never meet.** The active workspace is a stored id, set by the launcher, the
  dialog, a rail item or the first-boot declaration. The content address is the router's. Neither
  reads the other, which is exactly why an address cannot move a workspace.
- **A workspace definition already speaks in route paths.** Its declared tabs are addresses
  (`quotes/q-0005`), so a claim needs no new vocabulary, only a new field.
- **A definition is already audited at composition time**, and unusable parts are dropped with a
  message naming the workspace. That is the machinery a double claim joins; nothing new is needed to
  report one.
- **A workspace the user saves is a name, an id and a frozen arrangement.** It records nothing about
  where it came from, which is why a rule written only for declared workspaces would throw a user
  out of one they built for exactly the content they are opening.
- **Switching restores an arrangement.** It is not a repaint: the target's pane trees, hidden views
  and active tab come back. Anything that arrives with the switch has to survive it.

## Goals / Non-Goals

**Goals:**

- One place where the claim is honoured, so every way into content is covered by construction rather
  than by remembering.
- A product that declares no claims behaves exactly as it does today.
- The conflict is a message to the developer, not a coin flip at runtime.

**Non-Goals:**

- No plugin surface. A weaver neither claims nor names a workspace, and nothing here lets it.
- No user-authored claim, and no way to re-point a variant at another origin after saving.
- No say over whether saved workspaces appear in the rail. That is a question about what the rail
  offers rather than about where content lives, and it belongs to a change of its own.
- No claim over sidebar views. A view lives in a sidebar the workspace already decides; only content
  addresses are claimed.
- No opt-out for an address that must never move the user. Nothing needs one yet, and adding it now
  would guess at its shape.
- No change to how a workspace is switched by hand, and none to what a switch restores.

## Decisions

### The claim is declared on the workspace, not on the surface

A routable surface could carry the workspace it belongs to, which reads nicely at the point where the
document is defined. It is rejected for one reason that outweighs the ergonomics: **workspace ids
belong to the distribution.** A weaver that named one could not be installed into a second product
without editing it, and the Nx boundary that keeps a weaver from importing the shell exists to stop
exactly this kind of knowledge leaking downhill.

Declaring it on the workspace also puts the whole arrangement decision in one place. A reader of
`provideWorkspaces` sees which content the workspace lays out *and* which content belongs to it,
rather than having to search the weavers for who claimed what.

A third option, a separate provider mapping addresses to workspaces, was rejected for splitting one
declaration across two calls that must be kept in step.

### The claim is not derived from the declared tabs

The Quotes workspace declares `quotes/q-0005` as its baseline tab, so the workbench could infer that
it owns everything under `quotes/`. Rejected: a baseline tab is one concrete document, not a family,
and a product that seeds a workspace with a single example would find itself owning a whole
namespace it never mentioned. An inferred claim is a guess, and a guess that moves the user is worse
than no claim at all.

### Destination and staying are two questions, and only one of them is the product's

Where content goes is a statement about the product, so only a workspace the product declared can be
a destination. A workspace saved on one machine cannot be one: an address that led somewhere
different for every user would not be an address.

Whether the user is moved is a different question, and it is answered by whatever the workspace they
are in claims. That asymmetry is what lets a variant hold a claim without ever competing for an
incoming address, so a user's own workspaces can never create an ambiguity a developer has to
resolve, and the conflict audit stays over declarations alone.

### A saved workspace records its origin rather than a copy of its claims

Copying the claims at save time was the first idea and is worse in two ways. The claims would freeze:
a claim the product adds later would reach no existing variant, and nobody would ever think to go
back and fix that. And the origin would still have to be stored separately for the workspace list to
show it, so the copy buys nothing and costs a second field that can disagree with the first.

Storing the origin instead gives one field with one meaning — this is a variant of that — and the
claims are read through it. The consequence is deliberate: a variant follows its origin.

The origin is the **nearest declared** workspace rather than the immediate one, so saving from a
variant produces another variant of the same declared workspace. The relation is then always one step
deep and there is no chain to walk, no cycle to guard against, and nothing to repair when a variant
in the middle is deleted.

A missing origin is an ordinary state, not an error: saved from the built-in empty workspace there
never was one, and a product that stops declaring a workspace leaves its variants without one. Such a
variant claims nothing and is listed without an origin, which is exactly how it behaved before this
change.

### Showing the origin is part of the guarantee, not presentation

Once a variant behaves differently because of where it came from, the origin is the only available
explanation for why one saved workspace keeps quotes and another does not. Leaving it off the screen
would mean shipping a rule the user can feel but cannot see, and the usual result of that is a bug
report about randomness. So it is specified alongside the inheritance rather than left to whoever
draws the dialog.

### It is honoured where the address changes, not at each caller

There are four ways an address is reached: a link followed into the application, a restart, a
programmatic navigation, and a tab opened by a plugin. Honouring the claim at each of them is four
implementations, and the fourth one added later will forget.

So the claim resolves in the one place the workbench already funnels every address change through.
That is what makes the "no exception" decision buildable rather than merely stated: there is no
second path to leave out.

### The switch happens before the content is shown

Navigating first and switching after would put the document into the workspace the user was leaving,
and the switch would then park it there and restore the target's own arrangement over it. So the
order is: resolve the claim, switch, then apply the address inside the target. The document arrives
in the workspace that claimed it, which is the whole point.

### A narrower claim wins; only equals are a conflict

Two claims can overlap without being ambiguous: a family and a single address inside it. The
workbench already resolves a specific route against a general one, and reusing that ordering means
this case needs no new rule and behaves the way the same product's routing already behaves.

Genuine ambiguity is two claims neither of which is narrower. That is a **configuration error**: the
claim is dropped from both and the developer is told, naming the workspaces. The alternative,
first-declared wins, was rejected with the owner: it makes the application run on a decision the
developer never made, and the mistake then survives until someone reorders the declarations and the
behaviour changes for no visible reason.

### The first-visit rule gains a sentence rather than an exception

The capability already says an address naming content wins over the declared starting workspace.
Today that decides only what is shown. With claims it decides where too, which is the same rule
carried one step further rather than a second rule competing with it. The existing requirement is
modified to say so, so that a reader cannot find the two statements and wonder which governs.

## Risks / Trade-offs

- **A user deliberately in one workspace is moved out of it.** → Accepted, decided with the owner:
  a rule that holds only when the user did not click cannot be predicted by the person it moves.
  The lever stays with the product, which claims only what genuinely belongs to a workspace.
- **A product claims too broadly and makes a workspace inescapable.** → The claim is explicit and
  narrow by default, since nothing is claimed unless it is written down, and a narrower claim wins.
- **The switch costs an arrangement restore on a path that used to be a plain navigation.** →
  Only for a claimed address reached from a workspace that does not claim it, which is the case that
  is wrong today. Reaching content the active workspace already claims changes nothing.
- **A claim naming an address no surface serves.** → It simply never matches. Worth an audit message
  in the same list as the other definition problems, so a typo does not go unnoticed.
- **A user saves a workspace from Overview and then works with quotes in it.** → They are moved out,
  because their variant inherits Overview's claims and Overview does not claim quotes. That is the
  honest consequence of tying inheritance to the origin, and the remedy is in the user's hands: save
  the arrangement again from the workspace the content belongs to.

## Migration Plan

Additive. A definition without a claim is unchanged in every respect, so nothing to migrate and
nothing to roll back beyond the change itself.

## Open Questions

- Whether a product will need to say "this address must never move the user", the opt-out named as a
  non-goal above. Deferrable: it adds a field without touching the resolution, the ordering or the
  conflict rule, and the shape is easier to judge once a product has asked for it.
