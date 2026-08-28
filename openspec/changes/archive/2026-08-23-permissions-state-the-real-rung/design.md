## Context

See proposal.md — Why. What shapes the approach is that the surface is not asking a wrong question,
it is asking a question that has no answer for two thirds of its subjects.

The isolation vocabulary has exactly two words, and both belong to frame plugins: one whose frame is
stripped of an origin, and one that keeps its own. A trusted plugin is neither — it is not held back
by the browser at all, because it *is* the application. Asking "which of the two is this plugin"
about it has no true answer, and the machinery answers anyway, with the default.

The default itself is right where it belongs: a frame plugin that names no level runs isolated, and
the contract says so. The defect is that the question is asked of plugins the default was never
written for.

## Goals / Non-Goals

**Goals:**

- Every plugin listed in the permissions surface is described in terms true of it.
- The trusted rung is nameable, so it can be described rather than approximated.
- The contract carries the guarantee, so the next template edit cannot lose it.

**Non-Goals:**

- **Changing what any plugin may do.** Not one grant, refusal or default moves. This is about what
  the user is told, and only that.
- **A new field on the composition.** Which rung a plugin is on is already known from how it was
  registered; nothing new has to be declared by a distribution or a plugin.
- **Redesigning the permissions surface.** The note keeps its place and its shape.
- **Softening what the isolated line says.** It is accurate where it belongs and stays as it is.

## Decisions

### The rung is answered from how the plugin was registered, not from a default

The question the surface asks becomes one that can say "trusted" — what a plugin registered
in-process is — instead of choosing between two frame levels and falling back to one of them. A
plugin the isolation book has never heard of is trusted by construction, because that is the only way
it could have been composed.

*Why not give trusted plugins an entry in the isolation book* — that would make the book lie in the
other direction: it exists to record what the browser enforces around a frame, and a trusted plugin
has no frame. Recording "isolated: no" there invites the next reader to treat the three as one scale.

*Why not simply drop the note for anything not in the book* — considered, and it is the fallback
this change keeps for a rung that genuinely has nothing to say. But for the trusted rung there is
something worth saying, and it is the most important thing on the page: this plugin runs inside the
application. Silence there would be honest and useless.

### The trusted note says what being trusted costs the user

The isolated line reassures. The trusted line should not reassure and should not alarm; it should
state the arrangement — the plugin runs in the application, so what holds it back is the grant it was
given and the review it passed, not the browser. That is the true account, and it is the one that
makes the capability switches beside it mean something.

### The guarantee names the shape, not the words

The contract requires that each rung be described as itself, and that a rung without an account stay
silent rather than borrow one. It does not fix the sentences, because the wording is translation and
will be edited; what must not drift is that the sentence under a plugin is about that plugin.

## Risks / Trade-offs

- **A third line to keep in two languages.** → It is one string per language, and the suite that
  guards for raw keys already covers whether it is there.
- **"Trusted" reads as an endorsement.** → The wording says what the arrangement is rather than
  praising it: the plugin runs inside the application, and the grant is what holds it back. The word
  is already the one the contract and the guides use for this rung.
- **The fallback could be used as an excuse to say nothing.** → It is written as the answer for a
  rung with no account, and the trusted rung is given one in this change, so the fallback starts out
  unused.

## Migration Plan

Nothing to migrate: no grant, declaration or type changes. A distribution that composes only frame
plugins sees exactly what it saw before.
