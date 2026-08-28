## Context

The refusal path was measured, not recalled. `CapabilityError` is known to exactly three files: the
contract that defines it, the host context that throws it, and the command service that turns it
into a notice. There is no error handler anywhere in the workbench, so an error that escapes a
plugin's own code escapes the workbench too.

That is why the promise holds for a command and for nothing else. A command is invoked *by* the
workbench, so the workbench is on the stack when the gate refuses and can catch it. A button inside
a plugin's own view is invoked by the browser: the plugin is on the stack alone, and when it does
not catch, the error reaches the global handler that does not exist.

Five of the six capabilities are revocable from the permission settings; only the right to contribute
is not. So the silent state is not hypothetical — it is two clicks away, and the clicks are ones the
workbench invites.

## Decisions

**The seam is the global error handler, not more call sites.** Wrapping every gated member in a
report would put the reporting where the refusal is raised, and the refusal is raised in the one
place that cannot know whether anyone will handle it. The handler is the only point that sees
exactly the refusals nothing caught, which is precisely the set the requirement is about. The
workbench already installs the listeners that route uncaught errors and unhandled rejections there,
so both an event handler and a forgotten `await` are covered by the same decision.

**The command path keeps its own catch.** It catches before the error escapes, so it never reaches
the handler and cannot produce a second notice. Left alone deliberately: it also chooses the moment,
which the handler cannot.

**Across the frame boundary the quieter behaviour is given up, and said so.** A refused call returns
to a sandboxed plugin as a rejected answer. Whether the plugin caught it happens in a document the
workbench cannot inspect, so the two cases are indistinguishable from here. The choice is between
never reporting a sandboxed refusal and sometimes reporting one the plugin absorbed. The second is
chosen: a plugin that deliberately probes a capability is rare, a user staring at a dead surface is
not, and the guarantee now states the limit instead of implying a parity it cannot deliver.

**Activation is out of scope, and that is a consequence of an existing requirement rather than a
judgement.** A revocation never blocks activation — the grant consulted while a plugin activates
ignores revocations by design. A refusal during activation therefore means the composition granted
less than the plugin declared, which is a developer's mistake at build time. It is already reported
to the console, where the developer is, and a notice at startup would tell the user about a decision
they did not make and cannot fix.

## Risks

**A notice the plugin did not want.** Only across the boundary, only for a plugin that calls a
capability it may not hold and handles the failure itself. The notice is the existing one: a single
warning that replaces itself rather than stacking, with a way to the settings.

**A notice for something the user cannot change.** A refusal can also come from a distribution that
granted less than the plugin declared, not from a revocation. The wording already in place points at
the settings, where a permission the distribution never granted is not shown at all. Worth watching
once the wider path exists; not worth pre-empting with a second message before there is a case.

## Open Questions

None. The requirement exists, the gap is measured and the seam is the one Angular already provides.
