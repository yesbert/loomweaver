## Context

See `proposal.md` for why. What matters here is the shape the three routes have today, because the
work is almost entirely about closing a gap between them rather than inventing anything.

The **Nx route** already amends the consumer's workspace. `distribution/generator.ts` merges its
generated `project.json` into an existing one, keeping that project's own targets and tags; the weaver
generator amends the consuming application's build target with an i18n glob and appends an entry to
the application's stylesheet. So "a generator writes into files the consumer owns" is settled practice
here, with settled semantics: add what is missing, keep what is there.

The **command-line route** cannot do any of it. `scaffold.ts` produces a `FileMap`, `write.ts` plans
and writes it, and the plan refuses anything that resolves outside `--out`. There is no read step, no
merge step and no concept of a file the generator touches but does not own.

The **MCP route** hands generated content to an assistant. It has no workspace at all, by design.

One measured fact shapes two decisions below: an asset glob whose input directory does not exist is
harmless. A build with the frame-kit glob and no frame-kit package installed completes normally. So
that glob needs no conditional.

## Goals / Non-Goals

**Goals:**

- One declaration of what a scaffold needs from the workspace, consumed by every route according to
  what that route can do.
- The command-line route reaching the wiring parity the Nx route has.
- Amendment that is safe to run twice and safe to run over a workspace someone has already configured.
- A failure mode that is loud: what a route could not do is named in its own output.

**Non-Goals:**

- Understanding arbitrary consumer code. The composition step recognises a shape or declines.
- Supporting build systems beyond the two already supported. A workspace that is neither is told what
  to add, which is what happens today for all of them.
- Changing anything a consumer imports at runtime. No published runtime surface moves.
- Repairing a workspace that is already broken. Amendment adds; it never removes or corrects.

## Decisions

### A recipe declares amendments; a route applies them

A recipe today returns a `FileMap`. It grows a second, parallel product: a list of declarative
amendments, each naming a workspace file and the shape to ensure inside it. Nothing in the recipe
knows how to reach a filesystem or an Nx `Tree`.

Each route then applies that list with the mechanism it has: the command-line route with `fs` and a
JSON merge, the Nx route with `updateJson` and the existing helpers, and the MCP route not at all,
rendering the list as the steps it names in its output.

*Alternative rejected:* teach the command-line route to invoke the Nx generators. Nx is not present in
a plain Angular workspace, which is precisely the workspace the quick start creates.

*Alternative rejected:* keep the wiring in the recipe's generated `LOOMWEAVER.md` and make the quick
start point at it harder. That is the arrangement being replaced, and it failed exactly where a
document always fails: it was not read at the moment it mattered.

### Amendment is add-only, and idempotent by construction

Every amendment is expressed as "ensure this is present", never "set this". An asset glob is appended
when no entry with that input exists. The stylesheet is added to `styles` when it is not listed. The
service worker, the release-build style setting and the budgets are set only where the key is absent.

This falls out of the requirement that a consumer's own choice survives, and it has the useful
side-effect that re-running a scaffold over a workspace changes nothing. It also means the scaffold
cannot repair a workspace someone has configured wrongly, which is deliberate: silently overruling a
deliberate setting is the worse failure.

### The workspace root is found by walking up, not taken from the current directory

The PostCSS configuration belongs beside the workspace's `package.json`, which for a nested `--out` is
not `--out` and need not be the current directory either. The route walks up from `--out` looking for
the workspace marker and stops at the first hit.

*Alternative rejected:* write it into `--out`. It would land in the wrong place for any project not at
the root, and the failure would again be silent.

### The refusal to leave `--out` is scoped rather than removed

`write.ts` refuses paths that escape `--out`, including the symlink case. That guard exists to stop a
*supplied* target from escaping, and it keeps that job unchanged for everything in the `FileMap`.

Amendments travel on a separate track with a separate rule: each names a file from a fixed, known set,
resolved from the discovered workspace root, never from consumer input. There is no path in which a
flag value becomes an amendment target. The two mechanisms stay separate rather than the guard being
loosened, because a loosened guard is one that no longer says what it protects.

### An existing PostCSS configuration is merged when it is data and reported when it is code

A JSON configuration is merged: the plugin entry is added if absent, everything else is left alone. A
configuration written as JavaScript cannot be merged without evaluating or rewriting code, so it is
left untouched and named as a remaining step, with what happens if it is skipped.

*Alternative rejected:* refuse the run when a JavaScript configuration is present. The rest of the
scaffold is still useful, and refusing would trade a working scaffold for one file.

### The composition step recognises a shape and otherwise declines

To register a generated plugin, the generator locates the providers array of the composition root it
generated itself. Recognition is structural and narrow. When it succeeds, the import and the three
providers are inserted, the permissions taken from the plugin's own manifest. When it fails, the file
is untouched and the lines are printed, and the run does not claim the plugin was wired in.

*Alternative rejected:* compare the file byte for byte against freshly generated output and act only
on an exact match. It is simple, but a formatter run or a changed title defeats it, and it would
decline in the common case rather than the rare one.

*Alternative rejected:* parse with a TypeScript AST and insert properly. It is the most correct option
and it is what Angular's own schematics do, but it puts a compiler in the command-line bundle for one
insertion. Recognise-or-decline gives the same safety at a fraction of the weight; the AST remains the
upgrade path if recognition proves too brittle in practice.

### The guard runs the published quick start, not a simulation of it

The guard executes the commands as published, against a fresh application, and then asserts on the
result rather than on the commands: that the served styles carry the classes the chrome uses, that no
build-time directive survived into the stylesheet, that the strings resolve rather than rendering as
keys, and that the release build is styled under its own content-security policy.

Asserting on the outcome is the point. Every one of the four defects passed a green build; only
looking at the artefact catches them.

It needs a real registry install and a browser, so it runs nightly rather than in the merge gate,
consistent with how the end-to-end suite is already scheduled here.

## Risks / Trade-offs

**A workspace shape neither route recognises** → The amendment is skipped and named as a remaining
step, with its consequence. The scaffold degrades to what it does today, which is why nothing gets
worse for such a workspace.

**Recognition of the composition root proves brittle** → The fallback is the current behaviour: the
lines are printed and the consumer adds them. The failure is announced rather than silent, and the
TypeScript AST is the documented upgrade path.

**Writing above `--out` surprises someone** → Every such file is reported by name in the run's output
and in the trial run, so it is visible before and after. The set is fixed and small.

**The nightly guard is flaky because it installs from a registry** → It is nightly, so a transient
failure costs a report rather than a merge. It must distinguish an install failure from an assertion
failure in what it reports, or it will be ignored within a month.

**The guard cannot run before the packages are published** → It runs against locally packed tarballs
in the same arrangement used to reproduce this defect, which is what makes it runnable today; the
published packages are a later substitution, not a precondition.

## Open Questions

- Whether the release-build budgets belong in the amendment at all. The Nx route sets them, and
  without them a first production build warns immediately, which reads as a defect in the scaffold. It
  is also the setting a consumer is most likely to want as their own. Add-only semantics make it
  harmless either way, so this can be settled during implementation.
