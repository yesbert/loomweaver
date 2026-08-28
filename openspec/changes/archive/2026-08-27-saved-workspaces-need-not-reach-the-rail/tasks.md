## 1. The switch

- [x] 1.1 Add the switch to the workspace group a distribution composes, defaulting to what happens
      today so an existing product is unchanged.
- [x] 1.2 Stop offering saved workspaces in the rail curation dialog when it is off, so the user is
      never offered a placement that would not be honoured.
- [x] 1.3 Stop registering rail entries for saved workspaces when it is off, so an entry placed
      before the decision stops being drawn, while its stored placement is kept.
- [x] 1.4 Leave the report about a declared workspace nothing offers exactly as it is, so it never
      fires for a saved workspace the product chose not to offer.

## 2. Proving it

- [x] 2.1 Test that saving, renaming, resetting and switching all still work with the switch off, and
      that the workspace is reached through the dialog.
- [x] 2.5 Test that a placement made before the switch was turned off is kept, and shows again when
      it is turned back on.
- [x] 2.2 Test that the product's own rail entries are untouched, and that a declared workspace
      nothing offers is still reported.
- [x] 2.3 Test that nothing is reported about the saved workspaces themselves.
- [x] 2.4 Test that a product that sets nothing behaves exactly as before.

## 3. Documentation

- [x] 3.1 List the switch with the others in the distribution guide, saying what stays true when it
      is off, because that is the part a reader will want before flipping it.

## 4. Verification

- [x] 4.1 Run the workspace gate for the projects this touches, and the repository guards.
- [x] 4.2 Run `openspec validate --all --strict`.
