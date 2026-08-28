## 1. See the refusals

- [x] 1.1 Install a workbench error handler that recognises a capability refusal nothing caught and
  raises the notice the command path already raises, delegating everything else unchanged.
- [x] 1.2 Report a refusal that crosses the frame boundary, where the workbench cannot tell a
  handled one from an unhandled one.

## 2. Pin it

- [x] 2.1 A refusal raised outside a command reaches the user. Verify it fails without 1.1.
- [x] 2.2 A refusal a plugin in the page catches raises nothing.
- [x] 2.3 A refusal crossing the frame boundary reaches the user.
- [x] 2.4 An error that is not a refusal is handled as before.

## 3. Verify

- [x] 3.1 `openspec validate --all --strict` passes.
- [x] 3.2 The shell suite, the demo suites and lint pass.
