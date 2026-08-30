## Context

See `proposal.md` — Why.

Three things read from the code decide the shape, and the first of them changes the size of the work.

**The permissions surface already knows how to omit a switch.** Its template renders the plugin
switch behind `@if (!plugin.provided)` and the capability switches behind the same condition, and it
forces `enabled` true for such a row. So nothing about drawing this has to be invented; what is
missing is a second way to reach that state.

**`provided` comes from the plugin store.** `PluginDeploymentService.isDeployed` answers from the
entries a catalog marked as deployed. A plugin handed to `providePlugins` never passes through a
catalog, so it can never be `provided`, which is exactly why a composed plugin is always switchable.

**`provided` withholds both switches.** Reusing it would take the capability switches away as a side
effect, which would quietly narrow the guarantee that a user may revoke a granted capability.

## Goals / Non-Goals

**Goals:**

- A distribution can say a plugin is not optional, and the surface honours it.
- One answer to whether such a plugin runs, so the runtime and the surface cannot disagree.
- The user still sees what is installed and what it may do.

**Non-Goals:**

- No manifest field. Stated in the proposal and in the requirement, because it is the part most
  likely to be "simplified" back later.
- Not a second kind of deployed plugin. A composed plugin that is not optional is still composed, and
  its rung note keeps saying so.
- Not a way to hide a plugin. It is listed exactly as before, only without its own switch.
- No change to what `provided` means or does.

## Decisions

**A distribution-side declaration, beside the capability grants.** `provideCapabilityGrants` is
already the shape for "the composition root is the authoritative source, and a product backend can
replace it behind the same seam". Not-optional is the same kind of statement about the same subject,
so it goes beside it rather than inventing a second idiom.

**Read where the disabled set is read.** The runtime reconciles activation against
`PluginEnablementService.disabled`. If the declaration were honoured only in the settings component,
a plugin already in the stored disabled set would keep being deactivated while the surface showed it
as on and offered no way to fix it. Filtering the declared ids out of `disabled` gives both readers
one answer, and makes the "comes back on" scenario fall out rather than needing its own path.

**Its own state, not a reuse of `provided`.** They differ in what they withhold, and they differ in
why: a deployed plugin's capabilities were issued by an operator the user is not answerable for,
while a composed plugin's capabilities are the distribution's own grant and remain the user's to
withdraw. One flag for both would be a smaller diff and a worse answer.

**Reported in development, not refused at runtime.** Declaring a plugin nothing composed is a
composition mistake, and the codebase already has a precedent for exactly this: a capability granted
to a plugin that never declared it is flagged in dev mode and is otherwise inert. Throwing would take
an application down over a stale id in a list.

## Risks / Trade-offs

**A distribution can use this to make everything unswitchable.** → It can, and that is the same
authority it already has over grants. The requirement keeps the visibility half — the plugin and what
it holds are still listed — so the user is never left unable to see what is running.

**Two reasons a switch can be absent may read as one feature.** → They carry different notes, and the
rung note continues to say how the plugin arrived. A reader who wants to know why sees which of the
two applies.

**Someone will later propose folding this into the manifest, because it is one field fewer at the call
site.** → The requirement says why not, in its own text, rather than leaving the reasoning in a design
note nobody re-reads.

## Open Questions

None. Both questions raised while reading the report are answered above: a declaration naming an
uncomposed plugin is reported in development, and a plugin already switched off comes back on because
the declaration is read where the disabled set is.
