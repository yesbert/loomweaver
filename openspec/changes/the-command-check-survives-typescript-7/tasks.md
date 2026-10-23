## 1. The lookup

- [x] 1.1 Unit tests, failing first: a TypeScript with `createSourceFile` is returned; a TypeScript 7 stand-in without it is reported with its version; beside it, a stand-in compatibility package is returned instead; no TypeScript at all is reported as missing
- [x] 1.2 The lookup returns the compiler or what it found instead, accepting a module only where it can read a source file

## 2. The callers

- [x] 2.1 Unit tests for the MCP `validate_commands` finding without a usable compiler, in both cases
- [x] 2.2 CLI `validate commands` and MCP `validate_commands` word both cases and name the package to install

## 3. Document and close

- [x] 3.1 The JSDoc of the lookup; the guide's paragraph on the command check where it says what the check needs; `docs/reference/operations.md` on the guards that read the 6.0 interface
- [x] 3.2 The tooling suites, lint, `openspec validate --all --strict`
- [ ] 3.3 PR
