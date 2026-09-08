## 1. The run

- [x] 1.1 A fresh Angular app under `.claude/tests/assistant-path/`, taken through steps 1 to 3 of
      Getting started with the CLI (app, packages, distribution), the MCP server pinned to the
      released version in its `.mcp.json`. Record the versions of Node, Angular, the platform and
      Claude Code beside it.
- [x] 1.2 Run the first-weaver prompt through Claude Code in headless mode with
      `--output-format stream-json`, keep the raw capture beside the app, and serve the result to
      confirm the weaver's icon is in the rail. Run it a second time from a clean copy to see that
      the prompt reaches the tool both times.
- [x] 1.3 Run every prompt planned for the prompts section the same way, twice each. Note which
      tool each reached and what remained for the reader afterwards. Reword or drop the ones that
      did not reach the tool in both runs.
- [x] 1.4 Record in `design.md`, under a heading of its own, anything the assistant did that the
      tooling should have prevented or made easier. Open a change for each item that is the
      tooling's fault; the guide does not paper over it.

## 2. The guide

- [x] 2.1 Write `docs/building-with-an-assistant.md` in the six parts the design lays out, with the
      guide banner the other guides carry. The config blocks for Claude Code, Cursor and VS Code
      with Copilot are checked against each tool's current documentation on the day and link to it.
- [x] 2.2 The transcript, trimmed from the raw capture of task 1.2: prompt, tool call with
      arguments, the files written, the steps the assistant did from the returned list, the serve.
      Dated, with Claude Code's version named, trimming marked.
- [x] 2.3 The prompts section from task 1.3, one entry per prompt: the prompt, the tool it reached,
      what remains for the reader.
- [x] 2.4 The closing part that tells the two stories apart, linking the AG-UI guide and
      `examples/assistant-workbench/`.

## 3. Wiring the path

- [x] 3.1 `docs/getting-started.md`: a short pointer after the introduction, before step 1, for the
      reader who would rather ask an assistant from the first weaver on.
- [x] 3.2 `docs/README.md`: a row in "Pick your path", the guide in the numbered list after Getting
      started, the "For AI assistants" section rewritten to name the guide, the MCP server and the
      two files, and one sentence on the example beside the live demo.
- [x] 3.3 `llms.txt`: the guide under "Start here" and under the scaffolding and tooling section;
      the example under a short line of its own.
- [x] 3.4 `website/sidebar.mjs`: the guide under Guides after Getting started. The header
      navigation is not touched.
- [x] 3.5 `website/src/pages/index.astro`: the assistant door's aside links to the guide; the
      config block stays.
- [x] 3.6 `docs/samples.md` and `docs/scaffolding.md`: where each speaks of asking an assistant,
      one link to the guide; no text moved out of them.

## 4. The README and the small defects

- [x] 4.1 `README.md`: the link to the guide beside the prompt in the assistant door, a second
      prompt that shows a validator, one sentence on the example in the live demo section. Nothing
      removed or reordered.
- [x] 4.2 `.mcp.json`: the published `@loomweaver/mcp` registered beside the Angular server.
- [x] 4.3 `platform/libs/tooling/mcp/README.md`: `validate_commands` in the tool list.
- [x] 4.4 `docs/weaver/sandboxed-surfaces.md`: `sandbox-plugin` corrected to `frame-plugin`.
- [x] 4.5 `CONTRIBUTING.md`: a paragraph on contributing with an assistant, pointing at
      `llms-full.txt`, the repository's `.mcp.json` and the local-build override in operations, with
      the sign-off and no-attribution rules unchanged.

## 5. Verification

- [x] 5.1 The site builds from the branch: every new link resolves, the guide is in the sidebar,
      the landing page's door renders with the link.
- [x] 5.2 Read the path once as the reader would, from the landing page's assistant door through
      Getting started to the guide and to a running product, and fix what breaks the thread.
- [x] 5.3 `openspec validate the-docs-carry-the-assistant-path --strict` passes.
