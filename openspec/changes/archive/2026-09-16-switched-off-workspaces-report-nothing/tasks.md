## 1. The report respects the switch

- [x] 1.1 In the rail's workspace entries, report a declared workspace nothing offers only while the
      workspace controls are on.
- [x] 1.2 Unit test: with the controls off, a declared workspace nothing offers produces no warning,
      and switching to it from code still works; the existing tests for the report with the
      controls on stay green.

## 2. Documentation

- [x] 2.1 `docs/distribution/workspaces.md`: where the report is described, say it is silent while
      the workspace controls are off.
- [x] 2.2 `llms-full.txt`: the same sentence wherever the report is mentioned.

## 3. Saying it is done

- [x] 3.1 `openspec validate --all --strict`, lint, the shell unit suite, the comments and api-docs
      checks green.
