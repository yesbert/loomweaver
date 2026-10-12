## 1. Pin and fix

- [x] 1.1 Unit test: a gated, claimed address opened before the session waits in the initial workspace, moves into the claiming workspace once the session qualifies, and the initial workspace holds only its own tabs afterwards; unclaimed content stays where it was opened; see it fail first
- [x] 1.2 The placeholder route for content the session does not qualify for records the withheld visit; settling and the restart path's switch take its tab out of the waiting workspace
- [x] 1.3 Testbed e2e: a restart at a gated, claimed address with a late session, awaited and not awaited, leaves the initial workspace as it was; see it fail first

## 2. Verify and close

- [x] 2.1 The shell suite, lint, the related testbed specs
- [x] 2.2 `openspec validate --all --strict`
- [ ] 2.3 PR
