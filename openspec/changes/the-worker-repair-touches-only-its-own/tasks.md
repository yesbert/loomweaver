## 1. Pin the defect

- [x] 1.1 `worker-repair.spec.ts`: workers and caches of a distribution at the root and one under `/x/` on one origin, plus a foreign worker and cache; repairing either leaves the other and the foreign ones alone
- [x] 1.2 Run it and see the two neighbour cases fail on the current code

## 2. Fix

- [x] 2.1 `ServedBase`: the base as a path with a trailing slash
- [x] 2.2 `dropShellWorker`: match the worker by script and scope, the caches by `ngsw:<base>:`
- [x] 2.3 `UpdateService`: pass the base; the fake registration in its test carries a scope
- [x] 2.4 JSDoc of `activateUpdate`, `docs/distribution/pwa.md` and `llms-full.txt` say another distribution on the same origin is left alone

## 3. Verify

- [x] 3.1 The full shell suite
- [x] 3.2 Lint, formatting, `nx package shell` and the docs checks

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
