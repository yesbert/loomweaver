## 1. Pin the defect before fixing it

- [x] 1.1 A test asserts that a first visit which named no content shows the declared workspace's
  active tab. It must fail against the current implementation.
- [x] 1.2 A test asserts that a product serving a surface at the bare address still gets its declared
  workspace on a first visit — the case that hid this.

## 2. Navigate the adopted workspace

- [x] 2.1 Laying out an adopted baseline navigates to the workspace's active content tab when the
  boot address named no content.
- [x] 2.2 A boot address that names content is left alone, and the existing deep-link case still
  passes unchanged.

## 3. Verify

- [x] 3.1 The workspace unit suite and the testbed end-to-end suite pass, including the cases that
  cover switching and resetting, which must be unaffected.
- [x] 3.2 The testbed's declared review workspace is checked by hand or by test to show its own first
  tab rather than the testbed's root surface.
