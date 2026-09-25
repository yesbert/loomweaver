## Context

See `proposal.md` for why. Three routes generate a weaver from one recipe: the Nx generator reads the
workspace through Nx's tree, the CLI reads an Angular CLI workspace from disk, and the MCP server
returns a file map without reading anything. The recipe itself is a pure function of its input and
defaults the prefix to `lw` when none is given. The Nx weaver generator and the Nx distribution
generator also default to `lw` for the project they create, and the distribution writes that prefix
into its own project configuration, so a weaver generated into a fresh distribution would read `lw`
back from it.

## Goals / Non-Goals

**Goals:**

- Every route that can read the workspace names generated components after the composing
  application's prefix when none is supplied.
- No route falls back to the platform's prefix.

**Non-Goals:**

- Renaming components in projects generated before this change, the example's or the demo's. Those
  are tasks 13.5 and 12.14 of `the-code-reads-for-a-newcomer`.
- Reading the prefix from anywhere but the composing application's configuration (for example the
  npm scope), because that is where Angular and Nx already keep it.

## Decisions

**The adapters read, the recipe stays pure.** Reading the workspace is what the adapters already do
for placement and the import scope, so the prefix is resolved there and handed to the recipe as an
ordinary input. The recipe keeps a default only for the route that reads nothing. Resolving it inside
the recipe was rejected: it would give the pure generation core a dependency on a workspace.

**The neutral default is `app`.** It is the prefix Angular itself gives a new application, it matches
the `app-root` the distribution recipe already generates, and it reads as "the product's own".
Deriving a prefix from the weaver's id was rejected because it doubles the id in every selector
(`notes-notes-view`) and differs per weaver of one product; deriving it from the npm scope was
rejected because a scope is not a valid selector prefix in general.

**A generated distribution declares `app`.** Otherwise the Nx route would write `lw` into the new
application and a later weaver would faithfully read it back. The lint configuration the distribution
generator writes already allows `app` beside the chosen prefix; with the default the two are the same,
so the list is written without the duplicate.

**The weaver's prefix becomes an option of every route; the distribution's stays with Nx.** Until
now `prefix` was marked as a workspace placement option, which the CLI and the MCP server leave out
of their surface, so neither could be told a prefix and both always produced `lw`. The weaver
scaffold now declares its own `prefix`, offered by all three routes. The distribution keeps a
workspace-only one: its recipe emits no selector but Angular's `app-root`, so on the CLI and over MCP
the option would be accepted and do nothing. Because the CLI and the MCP server do not check an
option's pattern the way Nx checks its schema, the weaver recipe refuses a prefix that is not
kebab-case, the same way it refuses such an id.

**The MCP server asks rather than guesses.** It cannot read the workspace, so its description of
`prefix` tells the assistant to pass the prefix the application declares, and its default is the
neutral one.

**A patch.** Nothing in the published types changes, the option the CLI and the MCP server gain is
additive, and projects already generated keep their names. Only new output is named differently,
which the release notes state under "Changed".

## Risks / Trade-offs

- [A workspace whose application declares `lw` on purpose keeps getting `lw`] → That is the
  consumer's own declaration, which the requirement tells the generator to follow.
- [A consumer relied on the old default in a script] → A supplied prefix wins, so passing
  `--prefix=lw` restores the old output exactly, now on the CLI as well as with Nx.
