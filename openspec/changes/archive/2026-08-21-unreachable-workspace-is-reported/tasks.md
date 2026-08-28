## 1. Pin the diagnostic

- [x] 1.1 A test declares a workspace with no entry switching to it and asserts the developer is
  told, naming the workspace. It must fail against the current implementation.
- [x] 1.2 A test declares a workspace the product offers and asserts nothing is reported about it,
  including when the entry sits in a second rail.

## 2. Report it

- [x] 2.1 After the first render, a declared workspace that nothing switches to is reported once,
  in development only, naming the workspace and saying it is reachable only through the dialog.

## 3. Close the gap that produced it

- [x] 3.1 The distribution guide shows the rail entry beside the declaration, so a reader meets both
  together.

## 4. Verify

- [x] 4.1 The shell suite and the testbed end-to-end suite pass; the testbed declares workspaces and
  offers them, so it must stay silent.
