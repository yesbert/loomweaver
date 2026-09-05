## Context

See proposal.md, *Why*. What shapes the approach is what the demo already is.

Three workspaces, each declaring which views its sidebars hold and which tabs it opens. The quote
list is registered as a sidebar view and the quote document as a routable container at `quotes/:id`
that arranges three child surfaces. The dashboard is registered at the root address and draws
without chrome. Payment matching is a sandboxed frame plugin at its own address. So the demo already
has a list, a document with a layout of its own, an addressless landing view and an isolated plugin.
The material is there; what is missing is a way through it.

The workbench offers no navigation tree of its own, and no tree control among its named building
blocks. Whatever draws the second level is a plugin's own view built from the design tokens.

## Goals / Non-Goals

**Goals:**

- Answer the question the demo cannot answer today: how a large product is navigated on this
  workbench.
- Show what a rail entry is here, which is an arrangement that remembers itself, not a page.
- Keep the demo honest at every point in the build, never showing a page that exists only so that a
  menu entry has somewhere to point.

**Non-Goals:**

- A navigation primitive in the platform. See the decision below.
- Completeness as an ERP. This is a demo of a workbench, not a product; a module needs enough
  content to be believable, not enough to be used.
- Deciding whether the rail shows names. That is now the user's switch, and the demo ships with it
  off like everything else.

## Decisions

**The tree carries views; actions stand beside the content.** *New customer* is a button above the
customer list and a command in the palette. *Start dunning run* is a button in the dunning view and
a command. The reason is not tidiness: here a view is an address that can be opened in a tab, put
beside another, deep-linked and restored, and an action is a command that runs once. A tree whose
entries all change what you are looking at, except one that starts a dunning run, is a tree that
lies about that one entry. Rejected alternative: putting actions in the tree because that is how
some ERPs present them. It is also how those ERPs got their reputation.

**The tree is deliberately lopsided.** Every module having two areas and every area three views
would look tidy in a screenshot and prove nothing, because a navigation concept fails at its edges,
not in its middle. The rail work just showed this: what broke was the empty anchored band, the
label that would not fit in two lines, the entry that could not be told from its neighbour. So three
breaks are built in on purpose:

- *Overview* has no second level. Its sidebar shows no tree, which forces the question of what a
  module without areas does with its sidebar rather than leaving it to chance.
- *Finance* has six areas. It is the only place where folding an area open and shut earns itself,
  and the only place where the sidebar gets long enough to scroll.
- *Payment matching* is an area with exactly one view, which forces the question of whether an area
  with one child should be drawn as an area at all.

**Breadth first, depth as it is earned.** All six modules and all their areas exist from the first
slice, because the navigation concept is not visible without them. The views under them arrive with
the content that fills them. A module whose area has no view yet shows the area and says so plainly,
once, rather than offering an entry that leads to an empty page. A demo full of placeholder pages
reads as an unfinished product; the platform is what is on show, and it is not unfinished.

**The navigation view is a plugin's own, built once, not a platform primitive.** Six modules need
the same kind of sidebar list, which is exactly the shape of argument that produces a premature
abstraction. It is built once as an ordinary view that reads the active workspace and draws that
module's areas. If it turns out to be identical across all six, that is evidence for a primitive,
and the primitive then has a shape taken from practice rather than from a guess. Building the
contract first would mean guessing what a tree needs before ever having drawn one.

**A module is a workspace.** Not a route with a prefix. It costs more in declaration and it buys the
thing the demo exists to show: switching modules restores the tabs, the split and the sidebar of the
module being returned to. A route prefix would give navigation and nothing else.

## The structure

| Module | Areas | Views under them |
|---|---|---|
| Overview | none | the dashboard itself |
| Sales | Customers | Customer list, Contact history |
| | Order handling | Quotes, Orders, Returns |
| Finance | Receivables | Open items, Incoming payments |
| | Payables | Open items, Outgoing payments |
| | Payment matching | the sandboxed plugin, alone |
| | General ledger | Journal entries, Chart of accounts |
| | Closing | Balance sheet, Profit and loss |
| | Dunning | Dunning levels, Dunning runs |
| Procurement | Suppliers | Supplier master, Price lists, Ratings |
| | Purchasing | Requisitions, Goods receipts |
| Inventory | Stock | Item master, Stock levels, Counts |
| | Movements | Transfers, Goods issues |
| People | Employees | Personnel files, Leave requests, Working time |
| | Payroll | Payroll runs, Expenses |

Actions that were tempting to put in that table and did not go in: *New customer*, *Create quote*,
*Record return*, *Start dunning run*, *Post goods receipt*, *Stock count*, *Create transfer*, *Run
payroll*, *Record expense*.

## What the first look changed

Shown after the first slice and corrected on the spot:

- **The sidebar header names the module.** It read *Navigation* over the entries, which says nothing.
  A surface's title is fixed at registration and the contract offers no way to change it later, so
  rather than re-registering on every switch there is now one navigation surface per module, all six
  drawing the same component. The header is then a static, translated module name. The wrinkle: a
  user who curates another module's navigation view into a sidebar sees the active module's tree
  under a foreign header, because the component still follows the address.
- **Areas fold, and look like headings rather than entries.** Pulled forward from the Finance slice
  because the first look made the flat list unreadable: an area is now bold with a chevron, an entry
  is lighter with an icon, and the indentation between them is small rather than a whole tab. What is
  folded shut is remembered for the session, so it survives switching away and back.
- **Entries carry icons, from the set the workbench already depends on.** Heroicons outline, 311
  glyphs already installed, same 24 by 24 stroke as everything else, MIT. Font Awesome was considered
  and dropped: its Free icons are CC BY 4.0, which is not on the demo's licence allowlist, so the
  licence check would fail on it.
- **Overview has a sidebar of its own.** An empty panel on the landing page reads as unfinished. It
  now holds the open quotes, sent and undecided, each opening its document. The view belongs to the
  quotes weaver and the distribution places it, which is the arrangement the platform is for.

## Risks / Trade-offs

- Fifteen areas and some thirty views is more surface than the demo has today, and content is what
  makes a demo convincing or embarrassing. → Slices, and no view without content. The first slice is
  two modules; if the concept does not convince there, the rest is not built as planned.
- The quote list moves out of the sidebar, where a visitor may have learned to expect it, and the
  sidebar becomes navigation. → It is the point of the change rather than a side effect, but the
  quote list has to be as reachable as before, in one gesture from the tree.
- A tree that reads the active workspace is a plugin view that knows about workspaces. That is a
  granted capability, not a back door, but it is worth watching: if the view needs more than the
  workspace's identity, the design is drifting toward a primitive and should be reconsidered rather
  than extended.
- Six modules make the rail long enough that the bottom band and the module entries compete for
  space at a small window height. The rail scrolls now, so this is survivable, and it is also a case
  worth looking at rather than avoiding.

## Open Questions

- Whether an area with exactly one view is drawn as an area with a child, or collapsed into a single
  entry. Deliberately left to the moment Payment matching is built, because it is a question about
  how it looks, answerable by looking, and it changes neither the structure nor the slices.
