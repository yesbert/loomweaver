## 1. The guard first, so it fails on the defect it exists for

- [x] 1.1 Write a check that resolves every command the shell ships to the name it presents, in every
  language it ships, and reports two commands sharing a name or one command carrying two.
- [x] 1.2 Run it against the current strings and confirm it reports both defects by name: the
  collision between the app reset and the workspace reset, and the app reset's two labels.
- [x] 1.3 Wire it into `platform/package.json` and into the build workflow beside the other checks.

## 2. Each reset names what it resets

- [x] 2.1 `appReset.action` becomes the same wording as `appReset.title` in both languages, so the
  Settings button and the command search say the same thing. The key stays.
- [x] 2.2 `workspace.reset` becomes "Reset workspace layout" / "Workspace-Layout zurücksetzen".
- [x] 2.3 Check the three accessible names in the workspace dialog that use `workspace.reset` still
  read correctly with the longer wording, and that nothing is clipped where it is drawn. All three are
  icon-only buttons carrying the string as an `aria-label` beside a tooltip, so nothing draws it and
  nothing can clip; the longer name only makes the announced one say which reset it is.
- [x] 2.4 Correct "Arbeitsbereiche" to "Workspaces" in `appReset.confirm`, the one German string in
  the bundle that translates the term.

## 3. Pin it

- [x] 3.1 Run the check again: it passes.
- [x] 3.2 Unit test: the two resets present different names, and the app reset presents one name from
  both of its call sites. This is what would have caught the report.
- [x] 3.3 Confirm the German and English bundles still agree on their key sets, so no key was added on
  one side only.

## 4. Close it out

- [x] 4.1 Shell unit suite and `npx nx run-many --target=lint --all` in `platform/`.
- [x] 4.2 The end-to-end suites that drive either reset by name still pass, and any that match on the
  old wording are updated.
- [x] 4.3 `openspec validate --all --strict` at the repo root.
- [ ] 4.4 Open the pull request naming the reported defect, what each command is called now, and that
  no key was removed.
