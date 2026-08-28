## 1. The entry point follows the search it opens

- [x] 1.1 Generalise the shell's search entry-point component so it takes the command it opens plus
  the icon and accessible label to render for it, keeping the existing compact-in-a-bottom-bar
  behaviour, tooltip and chord hint in one place.
- [x] 1.2 Render nothing while the command is absent from the visible commands or unavailable to the
  session, resolving availability through the same seam every other trigger passes through rather
  than a check of its own.
- [x] 1.3 Test: with the command omitted, the entry point is not rendered and no control remains to
  activate. Test: a session that does not meet the command's access requirement sees no entry point,
  and the entry point appears once the session qualifies, without a reload.
- [x] 1.4 Test: with the shortcut layer switched off, the entry point is still rendered, still opens
  the search, and names no chord.

## 2. A second entry point, for the search over open work

- [x] 2.1 Add the sibling provider for the search over open work, mirroring the existing options
  shape (bar, slot, order) and defaulting to the status bar's leading edge, clear of the version
  item at its trailing edge. Give it its own contribution id so a distribution can omit it alone.
- [x] 2.2 JSDoc it on the published contract: what it places, that it is opt-in, its id, its
  defaults, and that it is independent of the command-search entry point.
- [x] 2.3 Export it and its options type from the shell's public entry point, and confirm both land
  in the packed declarations rather than only in the source barrel.
- [x] 2.4 Test: activating it opens the search in its open-work mode and not as the command search.
  Test: placing one entry point and not the other shows only the placed one.
- [x] 2.5 Run `npm run region-ids-check` in `platform/` — the new default targets `status-bar`, which
  the scaffolds emit, and this is the guard that says so.

## 3. What the scaffold generates

- [x] 3.1 Emit both providers into the generated composition root, with their imports, placed so a
  consumer reading `app.config.ts` sees them as theirs to move or delete.
- [x] 3.2 Update the distribution recipe's own tests to pin both calls and their imports in the
  generated output.
- [x] 3.3 Add a section to the generated `LOOMWEAVER.md` covering: both shortcuts and which badge
  shows which; moving a badge to another bar; removing a badge while keeping its search; removing a
  search entirely, which takes its chord with it; and binding a chord to a command of one's own, by
  re-registering under the built-in id or by omitting the built-in and binding a command of one's
  own. Name the third way as the one not to use: binding a chord the built-in still holds leaves two
  commands on one chord, warns to the console, and resolves by registration order.
- [x] 3.4 Run `npm run quick-start-check` in `platform/` — the published quick-start commands against
  a fresh application, which is what proves the generated composition root still compiles and serves.

## 4. Documentation the guards require

- [x] 4.1 Document the new provider in `docs/building-a-distribution.md`: the intent index near the
  top, and the command-palette-entry section, which gains the second badge and the fact that a badge
  disappears with its command.
- [x] 4.2 Add the new export to `llms-full.txt` in the same one-line form the existing provider uses,
  and extend the `llms.txt` distribution summary where it already describes the two entry points.
- [x] 4.3 Name both shortcuts in `docs/getting-started.md` § 7, beside the existing sentence about
  the weaver's own shortcut, saying where each badge is.
- [x] 4.4 Run `npm run api-docs-check` and `npm run comments-check` in `platform/` — the first fails
  on a published export documented nowhere, the second on JSDoc that is missing or on a comment that
  is not JSDoc on something a consumer can reach.

## 5. Close it out

- [x] 5.1 Run the affected unit suites and `npx nx run-many --target=lint --all` in `platform/`.
- [x] 5.2 Run `openspec validate --all --strict` at the repo root.
