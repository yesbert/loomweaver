> **Status:** proposed — not approved for implementation yet, and parked. See *Outcome*.

## Why

Today a plugin's permissions are decided by the distribution that composed it, or agreed once when a
user installs it, and after that the only feedback a refusal produces is a notice pointing at the
settings. That was enough while every plugin was reviewed by the operator and composed at build time.
It is no longer the whole picture: plugins can now be installed at runtime, so a user meets software
the operator vetted but they did not.

The direction was decided in July 2026 and deliberately not built, because there were no
third-party plugins to ask about. Installing at runtime exists now; a plugin written by a party the
operator did not vet still does not.

This is the largest unbuilt part of the platform. It is proposed here so that the queue holds it,
not because it is ready to build — the design note carries what was already decided and, more
importantly, what was not.

## Outcome

Parked on 2026-08-23, undecided rather than decided against, because the question turns out to hang
on a party that does not exist yet.

**Asking earns its cost where the user, not the operator, carries the risk.** Everything that runs
today arrives either composed with the product or from the operator's own catalogue, with consent
already given at installation. The party that would make a prompt worth its interruption is a tool
acting on the user's own machine through the local companion agent — and that agent is not built.

**The set is not shaped for point-of-use asking anyway.** Of the six capabilities, only two are
consulted at a moment the user caused: showing something, and moving around the content area. The
other four are consulted while a plugin activates or while a surface renders — the right to
contribute and the right to re-colour the application at activation, and the session while
rendering, which for a plugin in a frame is not even a call the plugin makes. A prompt at those
moments is the wall of consent at first start that this direction rejected in the first place, and
the two that do have a moment are the two with the least at stake. The prompt would buy least where
it would matter most.

**The agent's answer is not this one.** Where a capability acts on the user's machine, the browser
may only request it and the confirmation happens at the agent, out of band — the reasoning kept in
the design note. A prompt mechanism built now would not be reused by that; it would be replaced by
it.

**What was answered.** The gating question — whether the coarse names can be worded for an end user
to consent to — is answered yes, and on evidence rather than guess: they already are worded, and the
installation consent already shows them. Two of them said it in developers' words, which is
corrected alongside this parking.

**What was carried out separately.** The half of this entry that did not depend on any of the above
was a defect: the platform promised that a refusal reaches the user and delivered it for one path
only. That is `capability-refusal-visibility`, built and archived the same day. It reshaped the same
requirement the delta below modifies; that delta was reconciled with it and remains what it always
was — a draft that was never applied.

**What reopens this.** A tool acting on the user's own machine, or a plugin from a party the
operator has not vetted holding something worth a question. Neither exists today.

## What Changes

- A refusal at the point of use can ask the user rather than only reporting that it happened.
- The permissions surface becomes the place a user reviews what they have granted, which it partly
  is already.
- Nothing about the coarse permission set or the default-deny rule changes.

## Capabilities

### Modified Capabilities

- `plugin-permissions`: a refusal may ask rather than only refuse.

## Impact

Supersedes the decided-but-unbuilt direction carried in the design note of
`2026-08-18-backfill-plugin-permissions`. No other capability is affected.

**Not in scope, and each for a reason given in the design note:** anything reaching the user's own
machine through a local companion agent, which does not exist; per-tenant grants held by a server,
which the platform does not have; and a guard against one plugin displacing another's contribution,
which is a settled property of the trust model rather than a defect.
