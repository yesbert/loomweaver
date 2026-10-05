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

**Generate per interface, inside markers.** Each generated block is fenced by a marker naming the
declarations it holds (for example the plugin context, the menu item, the surface). The generator
prints members on one line each, without JSDoc, which is the form the file uses today. Prose between
blocks is left alone.

**Which declarations are generated is listed in the generator**, not inferred: the contract section's
blocks today, so the change moves no content in or out of the file.

**The command-line check uses the CLI's own option table**, the descriptors the CLI parses flags
with, rather than parsing its help text.

*Alternative rejected:* dropping the signatures and linking to the declarations. An assistant reads
one file; sending it to a dozen others is the cost the file exists to avoid.

## Risks / Trade-offs

- [The generated form is less readable than a hand-tuned one] → The blocks keep the current compact
  shape; where a hand-written comment carried meaning, it moves into the prose beside the block.
