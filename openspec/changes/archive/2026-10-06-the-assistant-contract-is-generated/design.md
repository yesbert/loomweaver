## Context

The packed `.d.ts` files are built in the pull-request build before the contract guards run, and the
API-docs guard already reads them. The icon catalogue shows the pattern this repository uses for a
derived file: a script with `--write`, and a guard that fails while the file differs.

## Goals / Non-Goals

**Goals:**

- Every signature an assistant reads in the contract section is what the packages declare.
- A command line the documentation shows for the CLI is one the CLI runs.

**Non-Goals:**

- Generating the prose. The value of the file is its compressed explanation, which only a person
  writes well.
- Checking code snippets for compilation. That would need a snippet harness of its own and is not
  what failed here.

## Decisions

**Check in place, and rewrite only what differs.** The plan was to generate each interface block
between markers, one member per line without comments, and to move the meaning the comments carry
into prose. Measured against the file, that would have moved almost every line of the contract
sections: nearly every member carries its explanation beside it, and that explanation is what an
assistant reads the file for. So the blocks stay as written. The guard compiles them in one program
beside the packed declarations and compares every interface, type, function and class they declare
under a published name with the published one by what it accepts: a union written out where the
package names it, or a `readonly` left off, is presentation and passes; a missing or surplus member,
a different parameter or return type, a name no package publishes, and a name the block uses without
anyone declaring it all fail. `--write` replaces exactly the declarations that differ with the
published text and leaves every comment where it stands.

**An interface is complete, a class may be a selection.** An interface is a shape a plugin fills or
reads, so a block that leaves a member out misleads whoever fills it, and the guard requires every
member. A class is a service, and the blocks list the members a reader needs; every member they show
must still be the published one.

**Which declarations are compared follows from the blocks**, not from a list in the guard: every
declaration in the two contract sections under a published name. The one exception is named in the
guard with its reason: a branded handle whose brand is not exported, shown as opaque on purpose.

*Alternative rejected:* the markers and a regenerated block per interface, for the reason above. It
would have kept the signatures true by losing the explanations, which are the file's value.

**The command-line check uses the CLI's own option table**, the descriptors the CLI parses flags
with, rather than parsing its help text. It is a test of the CLI itself, which reads every command
line the documentation gives, `npx @loomweaver/cli …` and the bare `loomweaver …` alike, and refuses
a command or a flag the CLI would refuse. The documentation is hashed into that test's inputs, so a
changed page is never answered from the cache.

*Alternative rejected:* dropping the signatures and linking to the declarations. An assistant reads
one file; sending it to a dozen others is the cost the file exists to avoid.

## Risks / Trade-offs

- [A rewritten line's comment can go stale] → `--write` says so when it runs, and the diff shows the
  comment beside every line it changed.
- [Presentation hides a real difference] → Only mutual assignability passes; a type that accepts more
  or less than the published one fails.
