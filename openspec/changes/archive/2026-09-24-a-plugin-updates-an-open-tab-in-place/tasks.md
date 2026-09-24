## 1. Contract

- [x] 1.1 `plugin-sdk`: the label type and `PluginContext.updateContentTab(path, label)`, with JSDoc stating the scope and the limit
- [x] 1.2 Tests that fail first: a tab behind another takes a new badge and the tab in front, the focus and the address stay; a tab in another pane takes a new title; what is left out stays; `null` takes the badge away; the change survives a restart; no open tab changes nothing and opens nothing; another plugin's tab is left alone; the capability is required

## 2. Implementation

- [x] 2.1 A pure function that patches the tab rooted at a path in a pane tree, and the tab service's `update` over every dock without navigating
- [x] 2.2 The host plugin context: the owner check and the capability; the sandbox contract and its sanitising; test fakes
- [x] 2.3 Testbed: a command that changes the badge of an open tab behind the one in front

## 3. Close

- [x] 3.1 `docs/weaver/content-area.md`, `docs/weaver/sandboxed-surfaces.md`, `docs/plugins.md`, `docs/distribution-api/tabs.md`, `llms-full.txt`
- [x] 3.2 Shell, SDK and testbed lint and tests, packaging, the repository guards (bundle size included), `openspec validate --all --strict`
- [x] 3.3 Code review, then archive on the same branch
