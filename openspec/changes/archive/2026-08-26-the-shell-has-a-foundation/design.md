## Context

See proposal.md — Why. Three things constrain the shape.

**The convention allows this, narrowly.** Folders are cut by feature, never by technical type. Named
cross-cutting folders are the one sanctioned exception and must stay small and justified. The shell
has two already, `persistence/` and `elements/`. A third has to earn the same standing, which means
it needs a rule for what belongs in it that a reader can apply without asking.

**`@loom/shell` is published from one barrel.** Consumers import from the package, not from paths, so
a symbol can move between files as long as `index.ts` still exports it. The packed declarations are
the proof, and comparing them against `main` is the established way to check.

**The checker measures the result.** The slice baseline is a ratchet that fails both when it grows
and when an entry is no longer true, so this change cannot land without the baseline being trimmed to
match reality.

## Goals / Non-Goals

**Goals:**

- The foundation has a name, a stated membership rule, and a lint rule that keeps it a foundation.
- The measured distance to a library split drops from 31 to 21, verified by the checker rather than
  claimed.

**Non-Goals:**

- Resolving the 21 pairs that remain. They are real coupling and each needs its own decision.
- Moving anything whose removal resolves no pair. Measured before, not guessed: the addressing
  primitives resolve zero and stay where they are.
- Splitting the shell into Nx libraries. The agreed direction is enforced boundaries inside one
  library, with a real split left open.

## Decisions

**Call it `foundation/`, and give it a membership rule rather than a vibe.** A module belongs there
when it satisfies both halves: **every slice may read it, and no slice owns it.** Feature flags
qualify because they are composition-time facts about the whole shell. `upsertById` qualifies because
it is a pure function over any id-bearing list. The two item modules qualify because they adapt a
contract type from `@loom/plugin-sdk` and the DI token that carries it. A service that holds feature
state does not qualify, however many slices call it.

The alternative — putting these in `persistence/` or inventing one folder per kind — was rejected
because `persistence/` means something specific and would stop meaning it, and because three tiny
folders are harder to police than one with a rule.

**Move `plugin-isolation-level.ts` whole rather than splitting the type from the service.** It is 69
lines holding one value type and the small service that reports the level actually reached. Splitting
them would put two halves of one idea in two places to save an import; the whole module satisfies the
membership rule, since neither `plugin` nor `permissions` nor `plugin-store` owns the concept.

**A lint rule, not just discipline.** `no-restricted-imports` on `foundation/**` forbids importing
from any sibling slice. Without it the folder becomes a dumping ground within a release, and then the
next reader cannot tell which of its two halves the rule was.

**Do not re-export from the old locations.** A re-export would spare the importer rewrites and leave
two paths to one symbol, which is how `CONTENT_DOCK` ended up needing a re-export in the previous
change. Rewrite the importers instead; the checker proves nothing was missed.

## Risks / Trade-offs

**A mechanical import rewrite corrupts something subtly** → do the rewrite with a TypeScript parser
over import specifiers, never a regular expression over source text, which is how this repository has
done it before. The proof is that the packed declarations still hold every published name and the
suite stays green.

**Moving `shell-features.ts` changes injection timing** → it is a 204-line module exporting a
provider function and a token. Moving a file changes no evaluation order that matters, but the
feature-flag defaults are read at composition time by four region slices, so the check is that
`provide-shell.spec.ts` and `shell-seeds.spec.ts` stay green, not just that the code compiles.

**The published surface changes by accident** → compare the packed `.d.ts` against a `main` worktree.
Note the standard from the previous change: private members do appear there and are not a public
change, so the test is whether any non-private line differs.

**Vitest will not catch a broken re-export** → it does not type-check. Packaging is the type check,
and that trap has already cost this series one red build. Package before believing the suite.

**The foundation grows into a junk drawer** → the membership rule is written into
`engineering-standards.md` beside the other two named folders, and the lint rule makes the most
common way of spoiling it a build failure.
