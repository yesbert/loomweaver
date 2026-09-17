## 1. The declaration

- [ ] 1.1 Add `agentConsent?: 'allow' | 'ask' | 'ask-always' | 'never'` to `Command` in
  `platform/libs/core/plugin-sdk/src/lib/command.ts`, with JSDoc that states the four values, that
  the platform states and does not enforce, that `never` is a statement and `callable` is the gate,
  and that asking and remembering belong to whoever runs commands on an agent's behalf.
- [ ] 1.2 Add the same optional property to `InvocableCommand`, with JSDoc pointing at the
  declaration it repeats.

## 2. The enumerated account

- [ ] 2.1 Carry it through `describe()` in
  `platform/libs/core/shell/src/lib/commands/command-invocation.service.ts`, untranslated (it is a
  value, not text).
- [ ] 2.2 Spec test: a caller listing commands reads the statement, and a command stating nothing
  carries none.
- [ ] 2.3 Spec test: the statement refuses nothing — a command declaring `ask-always`, invoked by
  identity with nobody asked, runs.
- [ ] 2.4 Spec test over the sandbox rung: the statement survives `invocableCommands` crossing the
  plugin boundary.

## 3. The tool description

- [ ] 3.1 `toolFor` in `platform/libs/integrations/ag-ui/src/lib/tool-definitions.ts` writes
  `metadata: { agentConsent }` where the command states something, and no `metadata` key at all where
  it does not.
- [ ] 3.2 Spec test: a tool for a command that states nothing is unchanged from today; one for a
  command that states something carries it.

## 4. The seam

- [ ] 4.1 `PendingToolCall` in `platform/libs/integrations/ag-ui/src/lib/command-tools.ts` gains an
  optional `agentConsent`, resolved per call from `ctx.invocableCommands()` at the moment the call
  completes, never from a list kept earlier.
- [ ] 4.2 Spec test: `before` receives the statement for a reachable command, and `undefined` for a
  command that is not in the account.
- [ ] 4.3 Spec test: nothing in the adapter asks, refuses or narrows on the statement's account — a
  call for a command declaring `never` still reaches the workbench when `before` answers `run`.

## 5. The check

- [ ] 5.1 Read `agentConsent` off a command registration in
  `platform/libs/tooling/devkit/src/lib/validate/commands.ts`, and report it in the offered line,
  saying plainly where a command states nothing.
- [ ] 5.2 Confirm by test that a command stating nothing neither fails strict mode nor warns, and
  that no finding is derived from an id or a title.
- [ ] 5.3 Mirror the report's wording in the MCP tool description in
  `platform/libs/tooling/mcp/src/lib/server.ts` where it summarises what the check says.

## 6. The scaffold

- [ ] 6.1 Remove `CONSEQUENTIAL` from
  `platform/libs/tooling/devkit/src/recipes/angular-weaver/agent-files.ts`; the generated command
  declares `agentConsent: 'ask'` and the generated `decide` reads `call.agentConsent`.
- [ ] 6.2 Update the generated comment so it explains the declaration rather than the list, and check
  the generated i18n keys for the confirm dialog still match.
- [ ] 6.3 Recipe test: generated output holds no list of command identities, and the generated
  decision asks the call what an agent's word is enough for.
- [ ] 6.4 Confirm the generated weaver still demonstrates the whole path: the stand-in run asks, and
  declining stops the command.

## 7. The written contract

- [ ] 7.1 `llms-full.txt`: the AG-UI section's example stops teaching `DESTRUCTIVE.has(...)` and reads
  the statement off the call; the command section states the property, its four values and its
  non-enforcement; the `PendingToolCall` line names the new field.
- [ ] 7.2 `docs/samples.md` sample 6 (`CONSEQUENTIAL` at line 733) reads the statement off the call
  instead of keeping a set; `docs/ag-ui-agents.md:82` and `docs/scaffolding.md:364` say how the
  generated weaver names its command consequential.
- [ ] 7.3 Run `openspec validate --all --strict`, the affected unit suites and the repository's
  guards, then reconcile the change's own artifacts with what was built.
