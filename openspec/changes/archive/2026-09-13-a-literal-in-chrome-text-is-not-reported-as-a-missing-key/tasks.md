## 1. The handler tells a literal from a key

- [x] 1.1 Report a missing key only for a string with the shape of a key: dot-separated segments of
      word characters, at least one dot, no whitespace. Anything else is returned as it is,
      silently, after a bundle has loaded as before it.
- [x] 1.2 Unit tests: a two-letter code, a single word, a name with a space and an address stay
      silent after a bundle has loaded; a dotted key the bundle lacks is still reported; a literal
      shaped like a key is reported; before any bundle has loaded nothing changes.

## 2. Saying it exists

- [x] 2.1 The rule in the published brief beside the first "key or literal" and beside the
      missing-key note.
- [x] 2.2 The rule in the i18n guide where it says a literal renders as-is, including the limit.
- [x] 2.3 `openspec validate --all --strict`, lint and the shell unit suite green.
