> **Status:** approved — approved for implementation on 2026-09-05.

## Why

The launch posts reached people once and then stopped; a curated list reaches the person who is
looking for exactly this, every day, for years. "Awesome" lists on GitHub and the ecosystem pages
of the standards LoomWeaver implements are read by developers who already want an Angular plugin
architecture, a workbench shell or an AG-UI frontend, and they rank for the searches the project
does not rank for yet. Submitting is free, and the only cost is the sentence, which
`position-as-angular-plugin-platform` fixes first. Both reviews of the marketing named this as the
overlooked free channel.

## What Changes

- **A short list of curated places, each verified before it is submitted to.** Candidates are the
  Angular ecosystem list (`awesome-angular`, active, entries merged daily, no plugin or shell
  category, so the fit is its *Micro Frontends* section beside Luigi), the nx.dev plugin registry
  (route to verify; the `awesome-nx` list is dead since 2024 and is not a candidate), and lists for
  micro-frontends, plugin architectures and Web Components. Each is checked for its contribution
  rules, its activity and whether the project fits its scope before any PR is opened; a list that
  is dead or does not fit is dropped from the worklist, not submitted to anyway.
- **One entry per list, in that list's format, carrying the qualifier sentence.** The entry is the
  sentence from `position-as-angular-plugin-platform` adapted to the list's line format. Where a
  list asks for a category, the category word is *plugin platform*, not *component library* and
  not *framework*.
- **AG-UI is a relationship, not a pull request.** The protocol's integrations page has no
  self-service route for a frontend; its contribution guide describes agent-framework integrations
  inside its monorepo with tests and CI. Getting listed means the Discord and the working group.
  The owner starts that conversation once the project is known enough that the request does not
  read as advertising; this change records the route and does not wait for it.
- **The owner opens every pull request.** Each entry is drafted here, and the owner submits it from
  their own account, because a submission is public and speaks for the project. The tasks record
  where each was submitted and its state, so the change is archived only when every entry is
  merged, declined or withdrawn.

No behaviour changes and no guarantee changes: nothing in the repository changes except the record
of where the project is listed, so the change declares `skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Repository.** Nothing in source or documentation. The record of listings lives in this change's
tasks and in its archive note; no second list is kept elsewhere.

**External.** Pull requests against third-party repositories, opened from the owner's account, and
a conversation with the AG-UI maintainers about a frontend listing, which has no documented route.

**Depends on.** `position-as-angular-plugin-platform`: the entry text is its qualifier sentence,
and a reviewer who clicks through must land on a page that says the same thing.

**Legacy sources dissolved.** None.
