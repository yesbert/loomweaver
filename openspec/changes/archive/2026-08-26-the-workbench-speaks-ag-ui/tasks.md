## 1. The package exists

- [x] 1.1 Create `platform/libs/integrations/ag-ui` with its `project.json`, `package.json`,
      tsconfigs and lint/test/package targets, matching how the published libraries are set up.
- [x] 1.2 Name it `@loom/ag-ui`, on the shared version, publishing to the same feed as the others,
      with `@ag-ui/core` as a peer dependency and `@loom/plugin-sdk` as its only other import. The
      proposal said the *client*; everything this package touches turned out to live in the core,
      whose only dependency is a schema library, so peering there asks a consumer for less and the
      "one copy" property still holds because the client pins the core exactly. The design note
      carries the reasoning.
- [x] 1.3 Add the `scope:integration` rule to `platform/eslint.config.mjs`, allowed to reach only
      `scope:integration` and `type:contract`, and tag the project with it. Verify lint refuses an
      import of `@loom/shell` from the new package. Also widened `scope:weaver` and
      `scope:distribution` to reach `scope:integration`, which the task did not name and the package
      is useless without: a weaver consuming the adapter is the whole point.

## 2. Describing the workbench

- [x] 2.1 Map one declared argument to its schema fragment: text, number, boolean, a choice as a
      string with an enumeration, and a list as an array of whichever it holds. Carry the
      description across.
- [x] 2.2 Map one entry of `ctx.invocableCommands()` to a tool definition, with the id as the name,
      the description as the description, and the arguments as the schema's properties and required
      list.
- [x] 2.3 Offer the list for a run, read at the moment the run starts rather than cached, so a
      plugin loading or a session changing is reflected.
- [x] 2.4 Decide and document what happens to a command with no description, since the workbench
      allows one and the protocol wants a string. It falls back to the title: an empty description
      makes a tool unpickable, and the workbench already warns the author in dev mode.

## 3. Running what the agent asks for

- [x] 3.1 Accumulate a streamed call: its start, its argument deltas concatenated into JSON, and its
      end. Handle the convenience form that carries a whole call in one event.
- [x] 3.2 Parse the accumulated arguments, and answer a call whose arguments are not readable as an
      error rather than passing something unusable to the seam.
- [x] 3.3 Run the assembled call through `ctx.invokeCommand` and answer with a tool result.
- [x] 3.4 Map the outcome: an answer becomes content, a refusal and a failure become an error with
      text that tells them apart, and a command declaring no answer reports plainly that it ran
      rather than returning an empty string.
- [x] 3.5 Answer a call naming a tool that is not a reachable command as an error, without reaching
      the seam.

## 4. The hook in front

- [x] 4.1 Let a weaver supply a hook that sees the assembled call before it runs and may let it
      through, decline it, or answer it itself.
- [x] 4.2 Verify the hook can only narrow: a call the hook lets through is still subject to the
      seam, and a hook cannot make a command reachable that the workbench would refuse.
- [x] 4.3 Make the hook optional, so the default path is the useful one and nothing has to be
      supplied to get it.

## 5. Proving it

- [x] 5.1 Unit-test the mapping for every declared kind, including a list and a choice, and for a
      command with no arguments.
- [x] 5.2 Unit-test the loop against a scripted sequence of events: a streamed call that runs, one
      refused by the seam, one that fails, one with unreadable arguments, and one naming an unknown
      tool.
- [x] 5.3 Unit-test the hook: letting through, declining, answering, and absent.
- [x] 5.4 Add the piece in the testbed that plays a fixed sequence against the live registry and
      asserts the workbench did what the events asked, with no network and no model. It composes
      through the published path — `providePlugins` and `provideCapabilityGrants`, a real plugin
      receiving a real `ctx` — so the proof is the consumer's own wiring rather than a reach into
      shell internals. That needed the command seam to be nameable, so `CommandInvoker`,
      `COMMAND_INVOKER` and `CommandInvocationService` are now exported from `@loom/shell` and
      documented in `docs/reference/host-services.md`.

## 6. Release surface

- [x] 6.1 Add the package to `scripts/bump-version.sh` so its version is stamped with the others.
- [x] 6.2 Add it to `azure-pipelines-publish.yml` and to the packaging step of
      `azure-pipelines-build.yml`, and confirm the package-exports guard covers it.

## 7. Documentation

- [x] 7.1 Write the package README, stating plainly what it does not do — no transport, no UI, no
      agent — and that its stability follows AG-UI rather than the platform.
- [x] 7.2 Write the weaver-author guide under `docs/`, showing the whole path: open a stream, hand it
      the plugin context, and let the workbench's own actions be what the agent reaches. Link it from
      the docs index, the site sidebar and `llms.txt`.
- [x] 7.3 Reference the new package where the published set is listed, so the count and the list stay
      true wherever they appear.

## 8. Verification

- [x] 8.1 Run the workspace lint, tests and build, and the seven repository guards.
- [x] 8.2 Run the website build, since a new guide is only reachable if the sidebar names it.
- [x] 8.3 Confirm no package under `platform/libs/core` gained a dependency, and that
      `openspec validate --all --strict` is green.
