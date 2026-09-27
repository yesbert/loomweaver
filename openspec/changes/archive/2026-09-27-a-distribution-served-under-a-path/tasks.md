## 1. Pin the gap

- [x] 1.1 Loader spec with a base of `/x/`: the workbench's strings, a namespace, the English fallback of an unshipped language and the default overlay directory are requested under `/x/`; a directory named from the origin's root is requested as named
- [x] 1.2 The same cases with a root base request exactly today's addresses
- [x] 1.3 Pop-out spec with a base of `/x/`: "Open in new window" opens `/x/popout/…`; a window at `/x/popout/…` knows it is a pop-out
- [x] 1.4 Run them and see the base cases fail on the current code

## 2. Fix

- [x] 2.1 Translation loader: resolve every request under the base the application declares, read by one shell service (`ServedBase`) that the pop-out uses too
- [x] 2.2 Overlays: the default directory becomes relative; a named relative one resolves under the base, one starting at the origin's root or a full URL is used as named; the refusal of the application's root stays
- [x] 2.3 Pop-out service: open the pop-out address under the base
- [x] 2.4 Pop-out window: recognise the pop-out from the address below the base
- [x] 2.5 Run the new specs green, then the full shell suite

## 3. Serve the testbed under a path

- [x] 3.1 `loom-testbed`: a build configuration with base `/x/` and a serve configuration with the serve path `/x/` on its own port
- [x] 3.2 `loom-testbed-e2e`: a Playwright project with that server and base URL that runs only `served-under-a-path.spec.ts`; the default project leaves it out
- [x] 3.3 `served-under-a-path.spec.ts`: strings arrive from `/x/i18n/…` and nothing from `/i18n/…`; "Open in new window" opens `/x/popout/…`, which starts as a pop-out
- [x] 3.4 Run it against the current code and see it fail, then green with the fix

## 4. Documentation

- [x] 4.1 `llms-full.txt`: the serving line, the overlay default and the pop-out paragraph say "under the application's base", and one paragraph states that a distribution may be served under a path and what it needs
- [x] 4.2 The guides in `docs/` that name `/i18n/` or `/popout/` as absolute addresses, starting with `docs/distribution/icons-and-i18n.md` and `docs/distribution/windows-and-sync.md`
- [x] 4.3 JSDoc of `provideTranslationOverrides`: the default directory and how a named one resolves

## 5. Close

- [x] 5.1 Lint for the shell, the testbed and its end-to-end project
- [x] 5.2 `openspec validate --all --strict`
- [x] 5.3 Note in the PR that this closes NextPA finding F-041, and what NextPA removes after the release
