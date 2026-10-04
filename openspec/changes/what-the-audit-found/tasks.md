## 1. A menu opened in a frame is the menu the page opens (own PR)

- [x] 1.1 Test first: an isolated surface opening an entry gets the menu matched against the opening entry's description, without untitled entries, with the heading; opening an entry that opens nothing, or one never shown, answers nothing
- [x] 1.2 Menu service exposes its resolution (labelled entries plus heading command); the page's open, offers and the frame bridge use it
- [x] 1.3 Slot bridge gains opening an entry under its subscription, deriving identity, description and heading as the in-page toolbar host does; activation runs entries and the heading as the menu service does
- [x] 1.4 Frame kit: the slot host gains opening an entry, the slot entry drops the further slot's identity, the slot view may carry a worded heading; the frame toolbar host draws with the shared menu drawing
- [x] 1.5 Test first, then fix: an entry whose own requirement asks to be inoperable is drawn disabled in a menu and does not run
- [x] 1.6 Testbed sandbox page, end-to-end test, guides and assistant file follow the new frame kit shape

## 2. What the seam and the report miss (own PR)

- [ ] 2.1 Test first, then fix: a sandboxed menu entry's own access requirement crosses as data; a malformed one is refused
- [ ] 2.2 Test first, then fix: the composition report names a routable surface's action that points at an unregistered command
- [ ] 2.3 One plugin state bridge: the frame session composes the surface bridge; key validation inside it, tested for both callers

## 3. Generators and checks that do what they say (own PR)

- [ ] 3.1 Escaping helpers for TypeScript literals, HTML and Angular template text; every recipe uses them; tests with quotes, braces, at signs and angle brackets, compiled where the recipe spec can
- [ ] 3.2 Nx distribution generator applies the package amendments and returns the install callback
- [ ] 3.3 `init` validates styles, weaver id and derived id before any step; installs platform packages at its own version from the scaffolds' amendments
- [ ] 3.4 Assistant server refuses unknown arguments; a test for the server's schema derivation
- [ ] 3.5 Frame plugin scaffold uses the frame kit's surface methods, state and toolbar connection; its notes name the declaration file
- [ ] 3.6 Catalogue check: `deployed` and `level` known and value-checked, protocol-relative addresses flagged; the field list checked against the workbench's parser by a guard
- [ ] 3.7 Default weaver shortcut `mod+alt+<letter>`; guides and examples follow

## 4. One implementation per job in the shell (own PR, no behaviour change)

- [ ] 4.1 Roving key to index in one helper, used by the toolbar, menu, select and pane tabs
- [ ] 4.2 Row measuring and the fold tray lifecycle shared by the bar and the toolbar
- [ ] 4.3 One menu-description coercion with a strict and a lenient mode
- [ ] 4.4 One stored-value parser; each reader keeps only its shape check
- [ ] 4.5 One helper registering a context-menu command with its entry; tab, view and rail context menus use it
- [ ] 4.6 Surface placement assertion and routable field copy owned by surface normalisation; the RPC sanitizer keeps wire-shape checks only
- [ ] 4.7 Small ones: chrome item activation, bar button resolved once, rail menu description, current address signal, path helpers, plugin toggle

## 5. One implementation per job in the tooling (own PR, no behaviour change)

- [ ] 5.1 Amendment planners in the dev kit (tailwind detection, entry stylesheet, object coercion, relative import, build target); the command-line and Nx routes perform them
- [ ] 5.2 Docs-site sync keeps one link rewriter with a target resolver

## 6. The demo and the testbed use what the platform ships (own PR)

- [ ] 6.1 Demo payments surface on the frame kit's surface methods and state store; its stylesheet drops its palette; its notes say why it needs the session
- [ ] 6.2 Testbed frame pages use the class contract and drop their palette fallbacks
- [ ] 6.3 Demo uses the shell's storage helper; dead attribute filter and stray comment removed; agent protocol versions aligned between demo and example
