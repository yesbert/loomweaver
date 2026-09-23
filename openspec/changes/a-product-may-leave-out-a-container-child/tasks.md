## 1. Contract

- [ ] 1.1 `plugin-sdk`: `PluginContext.setChildShown(childSurfaceId, shown)`, with JSDoc stating the scope and the limit
- [ ] 1.2 Tests that fail first, in a container with three children in one pane: one left out draws two tabs and no placeholder; brought back it returns in place with the others where the person left them; the focused child left out hands the focus and the address to a shown one; an address naming a left-out child opens the first shown child; a pane of only left-out children is not drawn; a left-out child is not offered by the picker and not closed in bulk; leaving out wins over the padlock

## 2. Store and plugin context

- [ ] 2.1 A store of left-out child ids; `setChildShown` on the host plugin context under `contributions`, a development report for an id that is not a container's child; the sandbox RPC and its sanitising; tests

## 3. Drawing and reaching

- [ ] 3.1 A pure function that prunes leaves whose tabs are all left out (declared-empty leaves stay) and collapses splits; the container pane host draws its result; tests
- [ ] 3.2 `stripTabs`, the pane body's active tab, `containerChildTargets`, closing in bulk
- [ ] 3.3 Focus and address: `leadUrl` / `followUrl` / the focused child fall back to the first shown child; `ContainerHandle.open` of a left-out child does nothing
- [ ] 3.4 Show it: a screenshot of the testbed container with a child left out and brought back, sent to the owner before going on

## 4. Documentation and close

- [ ] 4.1 `llms-full.txt`, `docs/weaver/containers.md`
- [ ] 4.2 Full suites, lint, packaging, the repository guards (bundle size included), `openspec validate --all --strict`
- [ ] 4.3 Code review over the change, then archive on the same branch
