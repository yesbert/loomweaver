## 0. Audit

- [x] 0.1 The replacement refusal: one admission check for every plugin below the application's own code (`surface-admission.ts`, called from the host plugin context's `refusesReplacing`, which exempts the trusted rung); a frame plugin reaches it through `frame-rpc-methods.ts`. The governing requirement is plugin-runtime's "Replacing a contribution is not open to a plugin outside the application's own code". No other place compares a new address with a held one.
- [x] 0.2 Ownership by the declaring route: `plugin-surface-ownership.ts` already resolves an address through the most specific declaration, and its spec pins `docs` / `docs/special` ("are not those another plugin declares more closely below one of its own"). Nothing to fix.
- [x] 0.3 Load failures: the frame runtime's connection has a time limit and reports a failed connection; nothing was registered, so the content area's placeholder said the view does not exist. The trusted runtime already remembers the addresses of an in-page plugin that failed (`failed-plugin-content.ts`); that holder is reused, not copied. The governing requirement is plugin-sandbox's "A plugin's lifecycle survives the boundary"; no requirement covered what the view shows.
- [x] 0.4 Capture: the skipped end-to-end test in `surface-withholding.spec.ts` observed every window and document event and every mutation; run unskipped, it saw no message event, the load of the renderer's elements and the renderer's clone nodes. The governing requirement is workbench-capture's "A plugin may keep part of its surface out of the picture".

## 1. An address under another owner's is refused

- [x] 1.1 Test first (`an-address-under-another-owners.spec.ts`): refused under the product, naming both addresses and the owner; refused under another frame plugin, the first keeping it; refused below a parameter of a held address; admitted below its own, beside another owner's and under the home address; the application's own plugins unchanged
- [x] 1.2 The admission check refuses a routable surface whose address lies under one another owner holds, with the same warning shape
- [x] 1.3 plugin-runtime delta

## 2. A view whose frame plugin could not be loaded

- [x] 2.1 Test first: the placeholder names the plugin and tries again, and says "does not exist" only for an address nobody answered (`route-unavailable-view.spec.ts`); the runtime names a plugin at the addresses it answered before, starts it again on retry, and names no plugin that never answered (`a-frame-plugin-that-could-not-be-loaded.spec.ts`)
- [x] 2.2 The frame runtime remembers per plugin the addresses and view ids it registered, in working state, reset on connect and dropped on removal; a failed connection hands them to the failed-content holder with the plugin's name and a retry
- [x] 2.3 The placeholder shows the title, the plugin's name and "Try again"; the keys are in every shipped language
- [x] 2.4 End-to-end (`sandbox.spec.ts`): the testbed's frame plugin is blocked on reload, its view names it, and trying again shows the view
- [x] 2.5 plugin-sandbox delta; the persistence guide lists the new working-state key

## 3. The capture limit is stated

- [x] 3.1 The skipped end-to-end test becomes a passing one: no message reaches the frame, only loads of the renderer's elements are seen, and the view's markup is the same after the picture
- [x] 3.2 workbench-capture delta

## 4. Verification

- [x] 4.1 `openspec validate frame-plugin-addresses-and-load-failures --strict`, shell lint and tests, packaging, the frame-kit bundle, the docs and contract guards, the production build
