## 1. The marking

- [x] 1.1 Teach the rail that an entry carrying a declared workspace is current while a variant of
      that workspace is active whose own entry is drawn in no rail, reading the product's switch
      and the user's placement rather than the registered items.
- [x] 1.2 Leave the entry otherwise as it is: icon, name, tooltip and what a click does.

## 2. Proving it

- [x] 2.1 Test that a variant nobody placed marks its origin's entry, and that the entry's name and
      icon are unchanged.
- [x] 2.2 Test that a variant the user placed marks its own entry and not the origin's, including
      when it was placed in the other rail.
- [x] 2.3 Test that a variant is marked on its origin while the product keeps saved workspaces out
      of the rail, whether or not the user had placed it before.
- [x] 2.4 Test that a variant without an origin marks nothing.
- [x] 2.5 Test that choosing the marked origin switches to the origin.
- [x] 2.6 Add the demo assertion: saving the Sales arrangement as a workspace of the user's own and
      switching to it keeps the Sales entry marked.

## 3. Documentation

- [x] 3.1 Say in the distribution guide's section on putting a workspace in the rail that the
      entry is also marked while a variant of its workspace is active and has no entry of its own,
      and amend the passage on keeping saved workspaces out of the rail accordingly.

## 4. Verification

- [x] 4.1 Run the shell tests and the repository guards for what this touches.
- [x] 4.2 Run `openspec validate --all --strict`.
