# The stand-in session arrives whole, and the recipes build nightly

> **Status:** proposed — not approved for implementation yet.

## Why

Two recipes on the samples page were written by hand on 2026-09-07, a navigation tree in the
sidebar and a session without a backend, and a change followed that proposed a generator for each.
The discussion behind it reached a different conclusion, and this change replaces that one.

A generator earns its place where something is wired across several files and a mistake stays
silent: the weaver scaffold writes eight files and changes three in the workspace, and a forgotten
assets glob degrades every label to its raw key without failing the build. The navigation tree is
not that. It is four files in one folder and one registration in the same weaver, and its content,
the groups, destinations, labels and icons, is what the product writes anyway. A generator would
write placeholders the reader replaces, or take a syntax for destinations the reader has to learn
first. The recipe and the AI-readable files already carry it, and an assistant writes the tree with
the product's real routes better than a generator can. So there is no navigation generator.

The session is the other case. The `auth-source` generator exists, and it writes half of recipe 12:
three snapshots and one step around them. What it does not write is the plugin with the three verbs
a user knows, sign in, switch and sign out, nor the four lines in `app.config.ts` that make the
shell read the stand-in at all. The generated file alone changes nothing on screen, because nothing
calls its step, and the one line that would connect it is the one silent trap in the story: leave it
out and a rail item says "Signed-in user" while everything gated stays hidden. That is exactly the
work a generator should take off a reader's hands, and the machinery to compose into
`app.config.ts` already exists for the weaver scaffold.

What both recipes lack is a guard against drift. They were compiled by hand against the published
packages once. The nightly quick-start check already builds a product against the packed platform
and drives it in a browser; it can carry the two recipes with it.

## What Changes

**`auth-source` writes the whole stand-in.** Beside the source file it writes today, the generator
writes the session plugin recipe 12 shows, with the three commands gated by `access` and the rail
item whose menu carries them, and composes it into a composition root that still presents the
shape the platform generated: the `provideAuthSource` line, the two icons, the grant and the
plugin. Where the root no longer presents that shape, it names the four lines instead. `--bare`
writes the source file alone, for a product that wants only the shape to map its own session onto.

**A guarantee for what is generated.** A stand-in session generated and served without further
edits lets its user sign in, switch and sign out from the rail, and every contribution gated with
`access` follows. That is a requirement under `scaffolding`, beside the one for the agent-ready
weaver, because it is the kind of promise a reader notices the moment it breaks.

**The recipes build nightly.** The quick-start check drops recipes 11 and 12 into the product it
scaffolds, read from the fenced blocks on the samples page by the path each block names, builds it,
runs its tests, and drives the tree and the stand-in in the browser the way the check already
drives the agent panel.

**The docs follow.** The recipe table on the samples page moves recipe 12 from half written to
written, the auth guide's stand-in section says the generator writes all of it, the scaffolding
guide's generator list and option table gain `--bare`, and the tooling line in `llms-full.txt`
follows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scaffolding`: a stand-in session can be generated that its user can operate on the first serve,
  with the verbs in the rail and gated contributions following.

## Impact

- `platform/libs/tooling/devkit`, the `auth-source` recipe, its descriptor and its amendments;
  offered unchanged through `@loomweaver/cli` and `@loomweaver/mcp` because one description serves
  all three
- `platform/tools/check-quick-start.mjs`, carrying the two recipes
- `docs/samples.md`, `docs/distribution/auth.md`, `docs/scaffolding.md`, `llms-full.txt`
- The proposed change `the-generator-writes-the-navigation-tree-and-the-session-verbs` is withdrawn
  by this one; it was never approved, and its reasoning is above
- No legacy source is dissolved by this change
