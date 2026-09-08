## Context

See `proposal.md`, Why. What the approach has to work with:

- The assistant door exists twice already, in `README.md` and in the landing page's "Two reasons
  people pick this up", with the same `.mcp.json` block and the same one-line prompt. Both end in
  that block. Neither links to a page.
- `docs/scaffolding.md` is the only page that treats the MCP server in depth and it is correct: the
  server returns a file map and never writes, the client writes, the workspace amendments the CLI
  makes are named as steps instead. The guide must not repeat that page; it links to it.
- `docs/getting-started.md` is CLI only and is what "Start in 5 minutes" opens.
- The MCP server exposes twelve tools. The CLI and the Nx collection expose the same seven
  generators under one name, `frame-plugin`; `docs/weaver/sandboxed-surfaces.md` calls it
  `sandbox-plugin`, which no adapter knows. That is a stale name, not a naming scheme to explain.
- `examples/assistant-workbench/` pins the released 0.9.2 packages and has a README that stands on
  its own. The dev.to article that it was built for is not published yet; the examples overview
  page is deferred until after it (decision of 2026-09-05).
- The site builds `docs/**/*.md` one to one, fails on a page missing from `website/sidebar.mjs`,
  and copies `llms.txt` into `public/`. The header navigation is a separate, shorter list.
- Claude Code is available in this environment with `--print`, `--mcp-config` and
  `--output-format stream-json`, so a run can be captured verbatim rather than retold.

## Goals / Non-Goals

**Goals:**

- One page that a reader arriving through the assistant door can follow to a running product, and
  that every other mention of the assistant path links to.
- Every prompt on that page has been run. Every config block on that page names the tool it is for.
- The two AI stories, building with an assistant and a product driven by an AG-UI agent, are told
  apart on the page that a reader is most likely to conflate them on.

**Non-Goals:**

- No rewrite of `docs/scaffolding.md`. Its MCP section stays the reference for what the server
  does; the new page is the path, not the reference.
- No new generator, tool or platform behaviour. Where the run shows a gap in the tooling, the gap is
  recorded here and becomes its own change.
- No examples overview page and no screenshots of the example; that is deferred as decided.
- No entry in the header navigation. The header is the short list of doors, and the assistant door
  already sits on the landing page one screen down; the sidebar and the overview row carry the
  page.

## Decisions

**The guide is one page under Guides, `docs/building-with-an-assistant.md`, placed right after
Getting started.** Alternatives: a section inside Getting started (rejected: the page would carry
two paths at once and the CLI steps would be interrupted by "or ask for it" asides on every step),
or a page under the sidebar's "For AI assistants" group (rejected: that group is for machines
fetching files; this page is for the person). The sidebar group keeps its two file links; the guide
links to them from its own text.

**Structure of the page, in reading order:**

1. What the assistant gets from the platform, in two halves. Knowledge: `llms.txt` as the map and
   `llms-full.txt` as the whole contract, which any assistant can be pointed at with a URL. Hands:
   the MCP server, whose tools generate the files an assistant would otherwise write from memory
   and whose validators return findings it can act on. One paragraph on why the two halves matter
   more for a workbench than for a page: the UI is where an assistant invents most, and here the
   UI is the same every time.
2. Registering the server, one block per tool: Claude Code (`.mcp.json` at the project root,
   `mcpServers`), Cursor (`.cursor/mcp.json`, `mcpServers`), VS Code with GitHub Copilot
   (`.vscode/mcp.json`, `servers`, `"type": "stdio"`). Every block is checked against the tool's
   current documentation on the day it is written and the page says nothing about tools it has not
   checked. A closing line says that any client speaking MCP works the same way, with the same
   command and arguments.
3. The path, as the five steps of Getting started, with the assistant taking over from step 3.
   Steps 1 and 2, the Angular app and the packages, stay commands the reader runs, and the
   distribution stays a CLI command too, because the CLI wires the build and the MCP server, by
   design, cannot. The page says so plainly and links to scaffolding's "who writes the files". From
   the first weaver on, the reader asks.
4. The transcript of a real run: the prompt, the tool call with its arguments, the files the
   assistant wrote, the steps it did afterwards from the list the server returned, and the serve
   at the end. Recorded once, dated, with the assistant and its version named, trimmed to what a
   reader needs and marked where it is trimmed. Nothing in it is retyped.
5. Prompts for the tasks a product meets, each with the tool the assistant reaches for and what
   remains for the reader afterwards: a weaver with a command and a settings section; the agent
   weaver (`--agent`); a theme; an auth stand-in; a settings store against an API; checking that
   every command is something an agent could call (`validate_commands`); translation parity
   (`validate_i18n`). Each prompt is run before it is written down, and a prompt that did not lead
   the assistant to the tool is reworded until it does or dropped.
6. Two stories, told apart. What this page was about: an assistant building your product. What the
   platform also does: a product driven by an AG-UI agent at runtime, where the agent reaches only
   what the user could have reached. One paragraph, a link to the AG-UI guide, and the assistant
   workbench example named as the runnable case of the second story.

**The distribution stays with the CLI, on the page and in the transcript.** Alternative: let the
assistant call `scaffold_distribution` and do the wiring from the returned step list. Rejected for
the guide's first path: the step list is exactly the part where an assistant may do less than the
CLI would, and the reader would be debugging the assistant's wiring on their first contact. An
assistant that has a shell may run the CLI itself, and the page says so in one sentence; the tools
earn their place after the app exists, with typed discovery for clients that have no shell and
validators that return structured findings.

**The transcript is recorded with Claude Code in headless mode**, against a fresh Angular app
under `.claude/tests/`, with the MCP server pinned to the released version, using
`--output-format stream-json` so the tool call and its arguments come out of the run and not out of
memory. The raw output stays in `.claude/tests/` beside the app; the page carries the trimmed form.
Alternative: a screenshot of an interactive session. Rejected: not searchable, not diffable, and it
ages as the tool's chrome changes.

**The assistant workbench example is linked as the counterpart, not as a second tutorial.** On the
new page it is the runnable case of the "driven by an agent" story. In `docs/README.md` and
`README.md` it gets one sentence each beside the live demo, in the section that already speaks of
the demo, so neither file grows a section for a single example. The article link is added when the
article is out, by the change that publishes it.

**The landing page's assistant door keeps its config block and gains the link.** The block is the
door's visual argument and stays; the aside under it, which today ends in the one-line prompt,
adds "Building with an AI assistant" as the place to continue. Alternative: replace the block with
a link. Rejected: a link carries no proof, the block does.

**`.mcp.json` in this repository registers the published server**, `npx -y @loomweaver/mcp`, beside
the Angular one. Alternative: the local build via `node platform/libs/tooling/mcp/dist/main.mjs`.
Rejected as the default because it fails to start until someone has run `nx bundle mcp`, and a
server that fails on connect teaches the wrong lesson on the first day; `docs/reference/operations.md`
keeps the local override for whoever is changing the generators. The CONTRIBUTING paragraph names
both.

**`sandbox-plugin` in `docs/weaver/sandboxed-surfaces.md` is corrected to `frame-plugin`.** No
adapter has ever exposed the first name; the sentence there is wrong, not the scheme.

**The README's assistant door adds, and removes nothing.** The link to the guide beside the prompt,
a second prompt that shows a validator rather than a generator so the door does not read as
"scaffolding only", and the example sentence in the live demo section. The "Two reasons" framing,
the door order and the config block stay as they were settled on 2026-09-04 and 2026-09-05.

## Risks / Trade-offs

- **The transcript ages with the tool.** Claude Code's output format and the model's phrasing
  change. → The page dates the run and names the version; the raw capture stays in the repository
  so it can be re-run; the trimmed form carries only the parts that are the platform's, the tool
  call, the file map, the steps.
- **A config block for a tool goes stale.** → Each block is checked against the tool's own
  documentation on the day it is written and links to that documentation, so the reader has the
  current form one click away when ours is behind.
- **The assistant does something in the run that the docs would rather it did not**, wiring a
  grant wrong, skipping a step. → That is a finding, not a thing to edit out. It is recorded in this
  note under a heading of its own and becomes a change against the tooling if it is the tooling's
  fault; the transcript shows the run as it was.
- **Free-text prompts lead to the tool only sometimes.** → Every prompt on the page is run at least
  twice; one that reaches the tool in one run out of two is reworded or dropped.
- **Naming three tools invites "what about mine".** → The closing line of the setup section says
  the command and the arguments are the same for every MCP client, so the reader with a fourth tool
  knows what to enter.

## What the runs showed

Recorded 2026-09-08. Sixteen headless runs of Claude Code 2.1.263 against a fresh `ng new` app on
platform 0.9.2 with `@loomweaver/mcp@0.9.2` pinned: the first-weaver prompt twice from the clean
distribution, then seven prompts twice each from the product with the notes weaver in it. Raw
captures, diffs and the app are under `.claude/tests/assistant-path/` in the context repository.
Every prompt reached its tool in both runs; none was reworded or dropped.

**Tooling defects, worked as their own change.**

- `scaffold_auth_source` over MCP names no remaining step. Its amendments are built only when a
  directory is known, and the MCP route never passes one, so the icon provider
  (`provideIcons({ account, signOut })`), the composition, the grant, the namespace and the asset
  glob are all dropped from the response; the output has no README to carry them either. Both runs
  found the missing icons by reading the shell's type declarations for some fifteen turns and
  contributed them from the plugin. Change: `the-mcp-route-names-the-steps-it-cannot-do`, which
  names the requirement in `scaffolding` it fails.

**Observations that are not defects.**

- The weaver generator defaults a command's shortcut to `mod+shift+` and the first letter of the
  id. The generated README says so; the option table in `docs/scaffolding.md` did not, and now
  does. Two weavers whose ids share a first letter collide, which the README also says.
- The generated settings store rejects on a network failure rather than resolving `undefined`.
  The port contract absorbs a rejection, so the workbench is not broken; the JSDoc on the port
  prefers resolving. One run rewrote the store to catch; the other left it. Worth a line in the
  generator when it is next touched, not a change of its own.
- The plain-weaver MCP result carries only `files`; the wiring steps live in the generated README.
  One run read that README and did not write it, the other wrote it without reading it. Both wired
  the product correctly, from `LOOMWEAVER.md` and the README's content. The follow-up change
  decides whether the steps should also be named in the response.
- The assistant's closing summary came back in German in every run although the prompt, the
  project and the locale were English. Cause not established; nothing of ours. The guide's
  transcript leaves the closing summary out and says so.
- One i18n run had its write of `de.json` refused by the client's own permission layer in
  headless mode; the assistant ran the parity check on the proposed content and reported instead.
  A tool behaviour of the client, not of the server.

## Open Questions

None.
