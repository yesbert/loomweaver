> **Status:** approved — approved for implementation on 2026-09-08.

## Why

The README and the landing page make building with an AI assistant one of the two reasons to pick
the platform up: the pain of teaching an assistant a new UI every project, `llms.txt` and
`llms-full.txt` as the answer, the MCP server, one example prompt. A reader who takes that door and
clicks "Start in 5 minutes" lands on a getting-started page that never mentions an assistant, and
the documentation index has no row for the path at all. The one page that treats the MCP server in
depth, the scaffolding guide, explains how a file gets created but shows no real run, and the whole
repository holds three one-line prompts, two of them the same. The only end-to-end AI example,
`examples/assistant-workbench/`, is linked from nowhere.

Building with an assistant is how a growing share of readers work now. The platform is unusually
well prepared for it, and the documentation says so on its front pages and then stops. This change
makes the path continuous from the first sentence to a running product.

## What Changes

- **A new guide, "Building with an AI assistant"**, becomes the target of the assistant door. It
  holds in one place what is scattered today: how to register the MCP server per tool (Claude Code,
  Cursor, VS Code with Copilot), what `llms-full.txt` gives an assistant and what the MCP server
  gives it, a set of prompts for the tasks a product actually meets (a distribution, a weaver with a
  command, an agent weaver, a theme, an auth stand-in, validation), and one transcript of a real
  run, recorded against a fresh project so the prompt, the tool call and the diff are true. It ends
  by separating the two AI stories the platform tells, building *with* an assistant and a product
  driven *by* an AG-UI agent, and points at the second.
- **The path is wired.** Getting started offers the assistant route at the top, the documentation
  index gains a row in "Pick your path" and its "For AI assistants" section names the MCP server,
  `llms.txt` lists the guide, the site's sidebar and navigation carry it, and the landing page's
  assistant door links to it instead of ending in a config block.
- **The assistant workbench example is reachable.** The new guide names it as the "driven by an
  agent" counterpart, and a short examples pointer in the documentation index and the README points
  at it. The overview page with screenshots stays out of this change, as decided on 2026-09-05.
- **The README's assistant door is touched up**, not rebuilt: the link to the guide, a second prompt,
  the examples pointer. No restructuring of the README.
- **Small defects with credibility cost are fixed on the way**: the repository registers its own MCP
  server in `.mcp.json` beside the Angular one; the `@loomweaver/mcp` package README lists
  `validate_commands`; the sandbox generator's two names (`sandbox-plugin` under Nx,
  `scaffold_frame_plugin` over MCP) are explained where the guide claims one generator behind three
  doors; `CONTRIBUTING.md` picks up the "contributor onboarding is a URL" promise with a paragraph
  on contributing with an assistant.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change adds and rewires documentation, an example config entry and a package README; no
requirement of `scaffolding`, `platform-composition` or any other capability changes. The change
declares `skip_specs`.

## Impact

- `docs/`: one new guide, edits to `getting-started.md`, `README.md`, `scaffolding.md`,
  `samples.md` where it carries the prompt today.
- Root: `README.md`, `llms.txt`, `CONTRIBUTING.md`, `.mcp.json`.
- `website/`: `sidebar.mjs`, `nav.mjs`, the assistant door in `src/pages/index.astro`.
- `platform/libs/tooling/mcp/README.md`: the tool list.
- No legacy source is dissolved by this change.
