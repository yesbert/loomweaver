## 1. The validator in the devkit

- [x] 1.1 Red tests first, beside the other validators: a fixture plugin with four commands (one
      complete, one callable without a description, one with an undescribed argument and no answer,
      one not callable) and one registration built from a spread; the expected findings name each
      command, the missing piece, the consequence, and the unreadable one as unreadable.
- [x] 1.2 The validator reads `registerCommand` literals with the compiler API the devkit already
      carries, returns findings in the shape the other three return, and appends the one line about
      grants, access and the window to every report.
- [x] 1.3 The strict rule: fail on callable without description, warn on an undescribed argument or
      a returned value without `answers`, inform on not callable, never fail on unreadable.

## 2. The three routes

- [x] 2.1 CLI: `validate-commands --dir <dir> [--strict]` in `run.ts`, in the usage text and in
      `list`, with a test beside the tests of the other three checks.
- [x] 2.2 MCP: a tool of the same name and options in `tools.ts`, with a test; the server's tool
      list in the docs names it.
- [x] 2.3 Run all four checks over `examples/assistant-workbench/src/tickets` and over the demo's
      weavers; the example's five commands come out as offered and complete, and whatever the demo
      reports is either fixed there on its own branch or recorded as intended. Run 2026-09-05:
      the example's five commands are offered and complete; the demo's quotes weaver registers
      its commands from variables in a loop, which the check reports as unreadable, as designed,
      and which is intended in the demo.

## 3. Documentation and hand-over

- [x] 3.1 `docs/reference/callable-commands.md` names the check where it explains the four fields;
      `docs/scaffolding.md` lists it with the other checks; the formatter and the dash checker pass.
- [x] 3.2 The guards that read the packed contract and the API docs pass; nothing in the published
      contract changes, so this is a confirmation.
- [x] 3.3 `openspec validate validate-commands-for-agent-reach --strict` passes; the pull request
      names the tutorial that will mention the command in one sentence.
