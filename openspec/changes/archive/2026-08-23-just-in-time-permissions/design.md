## Context

This carries forward what was decided in July 2026 and deliberately left unbuilt, so that whoever
builds it starts from the reasoning rather than from a blank page. The parts that are *not* decided
are marked as such, because the earlier record's greatest value is that it separated them.

## What was already decided

**No wall of consent at first start.** Neither a dozen dialogs nor one enormous one. The model is the
one phones settled on: ask at the point of use, and provide a settings surface for review afterwards.

**Two axes: what is at stake, and how much the party is trusted.** A low-stakes capability of a
first-party plugin composed by the distribution is granted without a prompt — that is what happens
today and it should stay. The prompt earns its cost where the user, rather than the operator, is the
one taking the risk.

**Grant authorities are separate.** A grant to a plugin belongs to the tenant and would be held by a
product's own backend through a port, in the same shape as the other persistence ports. The platform
stays tenant-blind.

**Anything reaching the user's own machine is different in kind.** Where a capability would act
through a local companion agent, the browser may only *request* it; the confirmation happens at the
agent itself, out of band. That is what keeps a compromised browser from escalating its own
privileges, and it is the reason the model is not simply "one more prompt". Precedents were named at
the time: an ssh agent's confirmation prompt, a hardware key's touch requirement, an operating
system's own privacy consent.

## What was explicitly not decided, and still is not

- **When the prompt appears for a composed plugin.** Today it never does. Whether a distribution
  should be able to opt into being asked is open.
- **Whether a declined request is remembered per capability, per plugin, or per session.** The
  requirement above says it is remembered; at what granularity is a design question.
- **What the surface looks like.** Nothing about wording or placement was settled.

## Why the scope is drawn where it is

**The companion agent is out of scope because it does not exist.** Specifying an out-of-band
confirmation for a component with no repository would be specifying a wish. The reasoning above is
recorded so that it is available when the agent is built, and nothing more.

**Per-tenant grants are out of scope because the platform ships no server.** A product that wants
grants to follow a tenant implements the storage port, which needs no change here.

**One plugin displacing another's contribution is out of scope because it is settled.** An audit
examined it and it was accepted as a property of the trust model: the operator's review and
same-origin delivery are the integrity boundary. A registry guard was noted as belonging with this
work; it belongs with it only in the sense that both concern untrusted plugins, and it should be
decided on its own merits rather than smuggled in.

## Measured on 2026-08-23, when this was parked

The check below was carried out, and it answered something other than what it asked.

**The wording exists and is already shown.** Each of the six carries a title and a description in
both languages, and the installation consent puts them in front of the user before anything is
installed. So the granularity has been judged in the field's own terms rather than in the abstract,
and it holds. Two descriptions spoke in developers' words — one named self-gating, one named the
host — and were corrected when this was parked.

**The obstacle is the moment, not the wording.** Where each capability is actually consulted:

| | when it is consulted | is there a moment the user caused? |
|---|---|---|
| contribute | while the plugin activates | no, and it is not revocable |
| re-colour the application | while the plugin activates | no |
| session | while a surface renders; for a plugin in a frame the workbench sends it unasked | no call to intercept at all |
| host facts | when the plugin reads the version or update state | barely |
| show something | when the plugin shows a dialog or a message | **yes** |
| move around the content area | when the plugin navigates or opens a tab | **yes** |

Two of six have a point of use, and they are the two with the least at stake. The four that would
justify an interruption all happen before the user has done anything — which is the wall of consent
at first start that this direction rejected. That is a fact about the shape of the set, not about
the wording of it, and it is why parking was chosen over a finer set.

## The one thing to check before building

The permission set is deliberately coarse — six capabilities, each naming a slice of the plugin
context. A prompt makes that granularity visible to end users for the first time, and "this plugin
wants to use the host user interface" may prove too vague to consent to meaningfully. Whether the
prompt needs a finer set, or better wording of the coarse one, is the first question the
implementation should answer, and it is cheaper to answer before the surface exists than after.
