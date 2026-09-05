## 1. A surface can be renamed

- [x] 1.1 Let a plugin rename a surface it registered, replacing the title on the entry the registry
      already holds rather than registering it again.
- [x] 1.2 Answer the same call in the sandboxed runtime, or refuse it plainly there.
- [x] 1.3 Unit tests: the panel header follows the new name; the mounted surface is not rebuilt; a
      name given as a translation key still follows a language change; renaming an unknown id does
      nothing.

## 2. Asking whether the current address lies under one

- [x] 2.1 Answer the question on the plugin's own surface, breaking on segment boundaries, live, and
      behind the permission that reading the active content already needs.
- [x] 2.2 Unit tests: a deeper address counts; a longer name does not; the address itself counts;
      nothing shown counts as nothing; without the permission it is refused.

## 3. Taking the workarounds out

- [ ] 3.1 The demo's navigation tree renames its surface through the contract instead of registering
      it again, and asks the workbench about the address instead of comparing strings itself. Waits
      on the platform shipping, because the demo consumes the published package; done on the demo's
      own branch once a version carrying this is out.
- [ ] 3.2 Confirm in the running demo that the sidebar header still follows the area and a deep link
      still marks its entry.

## 4. Saying they exist

- [x] 4.1 Both names in the consumer documentation, beside the ones they sit next to.
