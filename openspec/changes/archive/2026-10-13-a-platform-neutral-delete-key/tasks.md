## 1. Pin and build

- [x] 1.1 Unit tests, failing first: `del` gives the Backspace signature on macOS and the Delete signature elsewhere; `delete` and `backspace` keep their own signatures on both; the hint for `mod+del` is ⌘⌫ on macOS and `Strg+Entf` in German elsewhere, through the published formatting function as well
- [x] 1.2 A keybinding test: a command on `del` fires on Backspace and not on Delete on macOS, and the other way round elsewhere
- [x] 1.3 A clash test: `del` and `backspace` on two commands are reported as a clash on macOS and not elsewhere
- [x] 1.4 Resolve `del` with the platform beside `mod`, for the signature and for the hint

## 2. Document and close

- [x] 2.1 JSDoc of a command's shortcut, of a menu entry's shortcut and of the published formatting function; `llms-full.txt`; the shortcut lines of the weaver commands and menus guides
- [x] 2.2 The shell suite, lint, `openspec validate --all --strict`
- [x] 2.3 PR; tell NextPA that F-054 is fixed in the release that carries it
