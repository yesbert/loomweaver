## 1. The recipe

- [ ] 1.1 Red tests first, in the weaver recipe's spec: the generated command block carries an
      `arguments` entry of kind `choice` with a description key, an `answers` key, and a `run` that
      reads the argument; both bundles carry the new keys with parity.
- [ ] 1.2 The command block, the bundles and the weaver README follow; the recipe tests and the CLI
      snapshot tests are updated to the new shape.

## 2. The stand-in and the generated test

- [ ] 2.1 The stand-in template fills the first `enum` property of the picked tool's schema with its
      first value and sends `{}` otherwise; the comment about having nothing to fill from is
      replaced by one line that says where the value comes from.
- [ ] 2.2 The generated connection spec returns the command's real answer from its fake context and
      asserts the tone came back through `content`.
- [ ] 2.3 Scaffold a weaver with `--agent` into a scratch application, serve it, run the generated
      command from the panel and see the argument in the call and the answer in the result.

## 3. Documentation and hand-over

- [ ] 3.1 `docs/scaffolding.md` describes the generated command with its argument and answer; the
      formatter and the dash checker pass.
- [ ] 3.2 `openspec validate command-scaffold-shows-arguments-and-answers --strict` passes; the
      quick-start guard passes unchanged.
