## 1. The published handle

- [x] 1.1 Add the hold handle to the plugin SDK: an interface with a reactive held fact and hold and
      release commands, and an injection token, each with JSDoc stating what holding does, that it
      ends in the same place the product brings its nodes back, and that routable and isolated
      surfaces have none.
- [x] 1.2 Write a failing test that a docked in-process surface can inject a handle for its own
      instance, that two instances of one surface get independent handles, and that injecting it from
      a routable surface throws with an explanatory message.
- [x] 1.3 Provide the handle per mounted docked instance beside the view state.

## 2. Retention honours the switch

- [x] 2.1 Write failing tests for the stash: a held instance is not pulled on release, not hidden or
      moved on park, and not destroyed by the sweep; closing, discarding and turning its plugin off
      still end it and remove its nodes.
- [x] 2.2 Write failing tests for turning holding off: in use, the repair puts the nodes back at the
      anchor; after a collapse, the instance is released as the collapse asked; after a park, it is
      parked; an unkept clean instance is then destroyed by the ordinary rules.
- [x] 2.3 Implement the flag in the stash's release, park and sweep paths and re-apply the deferred
      effect when holding is turned off.
- [x] 2.4 Write a failing test that the retained component does not repair a held instance whose
      nodes are outside their place, then make its displaced check honour the flag.
- [x] 2.5 Confirm every existing retention test is unchanged, since a surface that never holds must
      behave exactly as before.
- [x] 2.6 Write a failing test that the retention collector does not evict a held, clean, unkept
      instance whose tab is open, lets it go by the ordinary rules once released, and still ends it
      when its tab closes; then report held entries from the stash and skip them in that eviction.

## 3. Proving it in a browser

- [x] 3.1 In the testbed, add a docked surface that holds itself and moves its element into a second
      container outside the workbench, and confirm in the running app that collapsing its panel,
      switching views and switching workspaces leave it there and running, and that releasing puts it
      back in its panel. Keep the probe out of the shipped testbed if it does not belong there.

## 4. Saying it where consumers read

- [x] 4.1 Describe the handle in the weaver guide beside the view state and retention, with the order
      a product follows: hold, move, and on every way back, move back or not, then release.
- [x] 4.2 Add the handle to the brief beside the view state, with its limits.
- [x] 4.3 Pack the plugin SDK and the shell and confirm the token and interface are in the packed type
      declarations and the documentation guard is green.

## 5. Closing

- [x] 5.1 Run the unit suites and the repository guards.
- [x] 5.2 Run `openspec validate --all --strict`.
