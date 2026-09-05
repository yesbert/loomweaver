## Context

See proposal.md, *Why*. What shapes the approach:

- Curated lists have contribution rules that differ: some require a minimum age or star count,
  some require the entry to be in a fixed format, some are inactive and merge nothing. A PR that
  ignores the rules is closed and the project is remembered for it.
- `awesome-angular` is active (entries merged most days, about ten thousand stars) and formatted
  as `[Name](link) - description`, one PR per suggestion, appended at the bottom of a category. It
  has no category for shells, plugin systems or workbenches; the fitting section is *Micro
  Frontends*, where Luigi sits. SCION Workbench is not listed there either.
- `awesome-nx` last merged a PR in 2024 and is dead by this change's own rule. The living Nx route
  is the nx.dev plugin registry, for which `@loomweaver/devkit` already carries the `nx-plugin`
  keyword; the current submission route was not found at first look and needs verifying.
- LoomWeaver implements AG-UI through `@loomweaver/ag-ui`, and the protocol's documentation keeps a
  page of integrations. That page has no submission text for a frontend, and the protocol's
  contribution guide is written for agent-framework integrations inside its monorepo. The client
  table in its README lists CopilotKit and one community terminal client. A listing there is
  valuable and is not something a pull request gets.
- The project's own positioning is being fixed in `position-as-angular-plugin-platform`. An entry
  that says "plugin platform for Angular workbenches" and links to a page that says "domain-agnostic
  plugin & UI platform" wastes the click.
- Honest expectation: one line among nine hundred in `awesome-angular` yields few clicks. The
  change is worth its twenty minutes, and it is not a channel to sequence other work around.

## Goals / Non-Goals

**Goals:**

- The project is findable from the places a developer who wants this already reads.
- Every entry says the same sentence the site and the README say.
- Nothing is submitted that a maintainer would reasonably decline.

**Non-Goals:**

- No self-made list, no "awesome-loomweaver". A list of one is a README.
- No paid directories, no listings that require an account on a marketing platform.
- No Product Hunt launch in this change: the audience there is not Angular teams, and a launch
  there is a different kind of work with a different day.
- No waiting on AG-UI: the conversation is started and recorded, and the change archives without it.

## Decisions

**Verify before submitting, and drop rather than force.** For each candidate: read
`CONTRIBUTING`, check the date of the last merged PR, check whether an entry of this kind exists
already (a shell, a plugin system, a micro-frontend alternative). A list that fails any of the three
leaves the worklist with a one-line reason in the task. The alternative, submitting to every list
that has the word in its name, produces closed PRs and no listings.

**`awesome-angular` is first, under *Micro Frontends*.** It is the one list that is verified active
and fitting. The entry sits beside Luigi and says what the project is to a reader of that section:
an alternative to micro-frontends for a product shaped as plugins. Format: `[LoomWeaver](link) -
Open-source plugin platform for Angular workbenches; an alternative to micro-frontends for products
built as plugins.` One PR, appended at the bottom of the section, capitalised title.

**AG-UI is a conversation the owner starts, later.** The owner decided on 2026-09-05 to defer it:
asked today, by a project nobody in that community has heard of, the question reads as advertising
and costs goodwill the project will need. It is asked once LoomWeaver is known enough that the
request reads as a contribution. The route is recorded in the tasks so that day needs no research;
the change archives without the listing.

**The entry is the qualifier sentence in the list's format.** Base text: *LoomWeaver: open-source
plugin platform for Angular workbenches. Panes, tabs, command palette, theming, a plugin store and
sandboxed plugins, with an AG-UI adapter.* Shortened to the list's line length; never lengthened
with adjectives. Alternatives considered: a per-list pitch tuned to each audience. Rejected for the
same reason as in the positioning change: recognition across places is the point.

**Every link carries a `?ref=`.** So the referrer survives and the archive note can say what the
listing brought, if anything.

**The owner submits, from the owner's account.** A submission is outward-facing and irreversible
in the sense that a closed PR stays visible. The assistant drafts the entry and the PR description;
the owner reads and opens it. The tasks name the PR URL once it exists.

**The record is the task list, then the archive note.** No file in `docs/` or the README lists
where the project is listed; that would be a second list that goes stale. When the change is
archived, its tasks carry the final state of each submission.

## Risks / Trade-offs

- [A list is inactive and the PR sits open for months] → Not a failure; the entry is recorded as
  submitted, and the change is archived with that state rather than waiting on it.
- [A maintainer asks for changes to the project (a badge, a licence file position, a demo link)] →
  Small requests are met on a branch of their own, outside this change; large ones are declined with
  the entry withdrawn.
- [The nx.dev registry route has changed or closed] → Recorded as dropped with the reason; the
  `nx-plugin` keyword stays on the package either way.

## Migration Plan

Implemented after `position-as-angular-plugin-platform` is on `main` and deployed, so every link a
reviewer follows lands on the new first screen. No rollback: a merged listing stays.
