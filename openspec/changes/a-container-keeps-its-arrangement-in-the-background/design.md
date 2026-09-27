## Context

See proposal.md, Why. A container keeps its inner arrangement as a dock of its own
(`container@<path>`). `ContainerDockGc` drops such a dock when nothing holds the container any more:
neither the address, compared by its tab root, nor any tab outside the container docks, compared by
its full path. A tab carries the address it was left at, which for a container with addressable
children is a child's address. So once the address moved to another tab, the container's dock had
nothing that counted as holding it and was dropped. When the tab came back to the front, the
container laid its children out again from its declaration and opened only the child the address
named.

## Goals / Non-Goals

**Goals:**
- A container's dock lives exactly as long as some tab holds the container, in any pane and any
  sidebar, whatever child that tab's address names.
- A regression test in the merge gate and a browser case in the nightly suite.

**Non-Goals:**
- Changing when a closed container's dock is dropped. Closing and reopening still starts from the
  declaration.

## Decisions

**Compare each tab by the content it holds, as the address already is.** The collector maps every
tab path to its tab root with the registered content routes before comparing it with the
container's path, the same function it already applies to the address. A path no route matches
maps to itself, so a view tab or an unregistered address behaves as before.

*Alternatives considered:*
- **Keep the dock when any tab lies at or below the container's path.** Needs no routes, but a
  separate surface registered below the container's path (`knowledge-base/tags` below a container at
  `knowledge-base`) would then keep a closed container's dock alive, and reopening it would bring back
  the old arrangement instead of the declared one. Rejected.
- **Store the container's own path on its tab.** A second record of what the route table already
  answers. Rejected.

## Risks / Trade-offs

- [The routes are read when the collector runs, so a container registered late cannot be recognised
  before it registers] → Unchanged from today, where the address is already compared the same way.
  The browser suite's reload case shows the routes are registered before the first collection.
