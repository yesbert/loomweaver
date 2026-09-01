## 1. Recognition replaces the rewrite

- [x] 1.1 Turn the step that filters a restored arrangement against the current claims into one that
      leaves the arrangement intact and returns what it found, keeping the existing development-time
      message and rewording it from "dropped" to "contested"
- [x] 1.2 Remove the suspension of that step for working state that reads back asynchronously, so
      every product is treated alike
- [x] 1.3 Keep dropping stored content that cannot be read as an arrangement at all, silently, and
      pin that it stays silent
- [x] 1.4 Update the existing tests that assert a contested tab does not come back, so they assert it
      does come back and that the claiming workspace has not gained it

## 2. An empty workspace stays enterable

- [x] 2.1 Record that a workspace was entered by an explicit choice, and let the navigation that
      follows that choice bypass the settlement
- [x] 2.2 Test that entering a workspace whose stored arrangement leaves it without content keeps
      that workspace active, replaying `demo/e2e/fixtures/damaged-payments-workspace.json`
- [x] 2.3 Test that an address the user asks for still settles into the workspace that claims it, so
      the deep-link guarantee is untouched

## 3. Resetting a named workspace

- [x] 3.1 Let the reset take an optional workspace and act on the active one where none is given
- [x] 3.2 Keep the navigation to the baseline's content for the active workspace only, and leave the
      user where they are when another workspace is reset
- [x] 3.3 Test both: a named workspace returns to its baseline without moving the user, and a reset
      with nothing named still resets the active workspace

## 4. The application reset may include the workspaces

- [x] 4.1 Let the application reset be asked to return every workspace to its baseline, off unless
      asked, without remembering the choice
- [x] 4.2 Keep the existing boundary as the default and leave its test in force
- [x] 4.3 Test that including the workspaces resets them all, and that a later reset does not include
      them again

## 5. The product's setting and the readable finding

- [x] 5.1 Add the feature argument to the workspace declaration that turns the announcement off for
      the whole product, on where the product says nothing, with JSDoc on the published contract
- [x] 5.2 Expose which workspaces cannot work as declared, beside what already says which differ
      from their baseline
- [x] 5.3 Test that the announcement is on by default, that turning it off silences it without
      changing what is stored or reachable, and that the finding is readable either way

## 6. What the user sees, as a slice

- [x] 6.1 Show the condition and offer the reset in the content area of a workspace that cannot work
      as declared, using semantic tokens and the shell's own building blocks
- [x] 6.2 Put the per-row reset in the workspace dialog, reachable without entering the workspace,
      confirming before it discards, beside a mark that says the workspace cannot work as declared
- [x] 6.3 Add the checkbox that extends the application reset across the workspaces, for that one
      action only
- [x] 6.4 Translate every new string in the languages the shell ships
- [ ] 6.5 Show the running result to the owner before anything further is built on it

## 7. Closing

- [x] 7.1 Run the demo against the recorded state end to end and confirm the payments workspace is
      reachable, names its condition, and repairs from the dialog without touching the quotes
      arrangement
- [ ] 7.2 Run the full check the repository gates on, and `openspec validate --all --strict`
- [ ] 7.3 Delete `/Volumes/Daten/Projects/ClaudeProjectContext/LoomWeaver/tests/damaged-payments-workspace.js`,
      whose purpose the test in 7.1 has taken over
