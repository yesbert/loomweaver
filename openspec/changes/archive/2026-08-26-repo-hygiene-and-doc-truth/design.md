## Context

See proposal.md — Why. What shapes the approach here is that the word `sandbox-kit` appears in three
kinds of place, and only one of them is a defect:

1. **Living instructions** — `CONTRIBUTING.md`, `SECURITY.md`, `openspec/config.yaml`. A reader acts
   on these today, so a wrong name here misleads.
2. **History** — `openspec/changes/archive/`, `.claude/docs/chronicle.md`,
   `.claude/docs/roadmap/`. These record what was true when they were written. The chronicle says so
   in its own header, and archived proposals are the reasoning behind decisions already taken.
3. **A path that was never renamed** — the archived `2026-08-22-frame-plugin-isolation-levels`
   proposal mentions a `/sandbox-kit/` serving path. That path is now `/frame-kit/` everywhere in
   the live tree, verified: no `.ts`, `.json`, `.mjs` or `.html` file outside the archive contains
   `/sandbox-kit/`.

The same three-way split applies to `.claude/CLAUDE.md`: it is a living instruction file, and it is
excluded from the GitHub mirror, so it stays German while everything else in this change is English.

## Goals / Non-Goals

**Goals:**

- Every name a reader can act on resolves to something that exists.
- The clean-up is verifiable by a command, not by inspection.

**Non-Goals:**

- Rewriting history. No file under `openspec/changes/archive/`, `.claude/docs/chronicle.md` or
  `.claude/docs/roadmap/` is touched, however many times it says `sandbox-kit` or cites an ADR
  number.
- Adding a guard that keeps stale package names out. That belongs with the other gates in the next
  change of this series, not here.
- Deleting regenerated build artefacts.

## Decisions

**Edit living instructions, leave history alone.** The alternative, a repository-wide search and
replace, would silently rewrite the record of why the rename happened and would make the archived
proposal describe a path it did not describe. History that has been edited to agree with the present
is no longer evidence. The cost of the split is that `grep -rn sandbox-kit` keeps returning hits
forever; that is acceptable, and the three-way split above is what tells a future reader which hits
are expected.

**Fix the `CLAUDE.md` project names against `project.json`, not against memory.** The tag examples
must name projects that carry those tags. Read from the workspace: `testbed-weaver` carries
`scope:weaver`/`type:app`, `loom-testbed` carries `scope:distribution`/`type:app`, `loom-shell`
carries `scope:platform`/`type:app`. The `demo/` product is named as what it is, an Angular
application outside the Nx workspace, because a reader who greps for it in `platform/` will
otherwise conclude the file is wrong again.

**Drop the ADR citation rather than translate it.** `ADR-0018 §7` explained why TreeWeaver left the
platform repository. The rule in the same file forbids citing a number that resolves to nothing, and
the reasoning survives in the archived change that dissolved the record. The sentence keeps its
statement and loses its footnote.

**Rename the `frame-kit` test suite even though nothing depends on it.** A suite named
`'sandbox-kit build'` inside `frame-kit` is the kind of small lie that costs somebody ten minutes
once a year. It is a string change with no behavioural reach.

## Risks / Trade-offs

**A `.DS_Store` sweep could delete something wanted** → scope the deletion to exactly
`-name .DS_Store`, and nothing else; these files are macOS Finder metadata and are already
gitignored.

**Deleting `platform/libs/core/sandbox-kit/` could remove a still-referenced asset** → the directory
holds no `project.json` and no source, so no Nx target can build it and no import can reach it. The
check before deleting is that `npx nx show projects` does not list it, and it does not.

**`openspec/config.yaml` is read by the tooling** → an edit there takes effect on the next OpenSpec
command. `openspec validate --all --strict` after the edit confirms the file still parses.

**The `.claude/` fixes are invisible to CI** → nothing in the pipeline reads `CLAUDE.md`, so a
mistake there surfaces only in the next session. Verification is therefore explicit in the task
list: every link target is checked for existence.
