> **Status:** approved.

## Why

A workspace is a whole way of working, and the workbench decides which one is active. Today it
decides on one input only: what the user last pointed at. A rail item, the launcher, the dialog, or
the declaration for a first visit. **Nothing else can move the user to a workspace**, and in
particular the address cannot.

That is a hole, and it shows the moment content is reached any way other than by hand. Measured in
the demo: from the Overview workspace, opening a quote leaves Overview active. The document lays a
tab strip over a dashboard built to have none, and the quote list is absent because Overview declares
its left panel empty. Opening the same address as a plain link does exactly the same, so this is not
about agents or commands. Every route into content that is not a click in the right place lands the
user in an arrangement built for something else: a shared link, a notification, the command palette,
a deep link from another product, an agent.

The workbench cannot fix this by guessing, because nothing tells it which workspace a piece of
content belongs to. That knowledge is the product's, and there is currently no way to state it.

## What Changes

- A workspace definition MAY **claim content addresses**. The claim answers two questions that are
  deliberately kept apart: **where content goes**, which only a declared workspace can answer, and
  **whether the user is moved**, which is no if the workspace they are in claims that address too.
- The claim holds **however the address is reached** — a link, a restart, a command, a programmatic
  navigation, a tab opened by a plugin. There is no "only from outside" exception, because a rule the
  user cannot predict is worse than no rule.
- A workspace the user saves becomes a **variant of the one it came from**: the workbench records
  that origin, the variant claims what its origin claims, and so the user is not thrown out of an
  arrangement they built for exactly this content. Without it the rule above would do just that,
  which is the case that decided the design.
- **The origin is shown** wherever workspaces are listed. It is the reason one saved workspace keeps
  quotes and another does not, and a rule whose reason is nowhere on screen is met as an accident.
- A first visit at a claimed address lands in the **claiming** workspace rather than in the one the
  distribution declared as the start. The existing rule that an address naming content wins over the
  declaration now decides the workspace too, not only what is shown.
- Two declared workspaces claiming the same address is a **configuration error**: the claim is
  dropped, the developer is told, and the application runs on today's behaviour for that address.
  This follows the capability's existing habit of dropping an unusable part of a definition and
  naming it, rather than picking a winner the developer never chose. A variant cannot take part,
  because it is never a destination.
- Nothing is added to what a plugin can do, and nothing to what a user can declare. Workspace ids
  belong to the distribution, and a weaver must not have to know them to put its own document in the
  right place. What a user decides is which workspace they save and from where.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: two new requirements — a workspace may claim content addresses and reaching one
  activates the workspace that claims it; and a workspace the user saves is a variant of the one it
  came from, records that origin, inherits its claims and is shown with it. The first-visit
  requirement gains the sentence that an address winning over the declaration decides the active
  workspace as well as the content.

## Impact

- The workspace definition surface a distribution composes gains the claim. Existing definitions
  claim nothing and behave exactly as they do today, so this is additive.
- The workbench's routing and workspace activation meet each other for the first time: today
  navigation decides content and the launcher decides the workspace, independently.
- What a saved workspace stores gains its origin, and the surface that lists workspaces shows it.
- The demo's Overview and Quotes workspaces: Quotes claims the quote document address, which is what
  makes the reported behaviour right without touching a single weaver.
- The distribution guide, since composing workspaces is what it is for.
- No legacy source is dissolved by this change.
