## 1. Pin the defect

- [x] 1.1 Add a failing test that boots the shell with routes a distribution owns (a concrete page
      and a redirect for the address naming no content) and asserts both still resolve once the
      contributed content routes are in place. Today it fails with no route matching.
- [x] 1.2 Extend it so the contributed set changes after start-up (a route registered later) and the
      distribution's routes still resolve.

## 2. Carry the routes into every table

- [x] 2.1 Remember the routes the distribution hands over where the service that rebuilds the route
      table can read them.
- [x] 2.2 Build the table in the order the design fixes: popout, the distribution's concrete routes,
      the contributed content routes, the deep-link placeholder, the distribution's catch-alls.
- [x] 2.3 Make 1.1 and 1.2 pass, and confirm no existing routing test changes behaviour.

## 3. Say what is shadowed

- [x] 3.1 Report, in development only, each address declared both by the distribution and by a
      contributed content route, in the shape this codebase already uses for contested declarations.
- [x] 3.2 Report an address once, not again each time the contributed set changes.
- [x] 3.3 Test both: the address is reported, and a plugin toggled off and on does not repeat it.

## 4. Pin the rest of the requirement

- [x] 4.1 Test that an address the distribution owns opens no tab and leaves the arrangement alone.
- [x] 4.2 Test that a catch-all the distribution declares answers only where nothing else does.
- [x] 4.3 Test that a redirect declared for the address naming no content takes effect when the
      application is opened there.

## 5. Close it out

- [x] 5.1 Check the seam's own documentation still describes what the code now does, and correct it
      where it does not.
- [x] 5.2 Run the shell's tests and the repository's guards.
