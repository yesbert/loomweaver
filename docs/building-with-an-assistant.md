# Building with an AI assistant

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `scaffolding`. Where this page and a specification disagree,
> the specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The same product as [Getting started](getting-started.md), with an assistant doing the typing from
the first weaver on. This page says what the assistant gets from the platform, how to register the
tools in Claude Code, Cursor and VS Code, and what a run looks like. The run in the middle of the
page was recorded as it happened, and every prompt at the end was run before it was written down.

## What the assistant gets

Two things, and they are different in kind.

**Knowledge.** [`llms.txt`](../llms.txt) is the curated map of this documentation, and
[`llms-full.txt`](../llms-full.txt) is the whole published contract inlined into one file: every
interface a weaver imports, every provider a distribution composes, and one canonical weaver and
distribution as code. Any assistant can be pointed at either with a URL, and from then on it knows
the workbench the way it knows the framework.

**Hands.** `@loomweaver/mcp` is a server speaking the
[Model Context Protocol](https://modelcontextprotocol.io/), and it gives the assistant the
platform's generators and validators as tools. Asked for a weaver, it calls `scaffold_weaver`
instead of writing a plugin from memory, and what lands in your diff is the generator's output,
the same eight files the CLI would write. Asked whether the product's commands are ready for an
agent, it calls `validate_commands` and answers from findings rather than from an impression. The
tools are the same generators the CLI and the Nx collection run; [Scaffolding](scaffolding.md) is
the reference for what each one emits and for the options.

Why this matters more for a workbench than for a page of forms: the UI is where an assistant
invents most, because every project has its own. Here it does not. The rail, the panes, the palette
and the plugin contract are the same in every product built on the platform, and they are written
down for machines.

## Registering the server

The server runs over stdio and is fetched on demand, so nothing is installed in your application.
Each tool reads a file of its own; the command and the arguments are the same in all of them.

**Claude Code** reads `.mcp.json` at the project root, checked in so the whole team has it
([documentation](https://code.claude.com/docs/en/mcp)):

```json
{
  "mcpServers": {
    "loomweaver": { "command": "npx", "args": ["-y", "@loomweaver/mcp"] }
  }
}
```

**Cursor** reads `.cursor/mcp.json` in the project, or `~/.cursor/mcp.json` for every project
([documentation](https://cursor.com/docs/context/mcp)):

```json
{
  "mcpServers": {
    "loomweaver": { "command": "npx", "args": ["-y", "@loomweaver/mcp"] }
  }
}
```

**VS Code with GitHub Copilot** reads `.vscode/mcp.json`, and its top-level key is `servers`
([documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)):

```json
{
  "servers": {
    "loomweaver": { "type": "stdio", "command": "npx", "args": ["-y", "@loomweaver/mcp"] }
  }
}
```

Any other client that speaks the protocol takes the same command and arguments in its own file.
Unpinned, `npx` takes the latest server, whose generators emit code for the latest platform line;
a project on an older shell pins the server to it, `@loomweaver/mcp@0.9.2` in the arguments, as
[Scaffolding](scaffolding.md#the-mcp-server--loomweavermcp) describes.

## The path

Steps 1 to 3 of [Getting started](getting-started.md) stay commands you run yourself: the Angular
app, the packages, and the distribution.

```bash
ng new my-studio --style=css --ssr=false && cd my-studio

npm install @loomweaver/shell @loomweaver/plugin-sdk @loomweaver/frame-kit @angular/cdk @jsverse/transloco @ng-icons/heroicons \
  @angular/service-worker@$(node -p "require('@angular/core/package.json').version")
npm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography

npx @loomweaver/cli distribution --name my-studio --title "My Studio" --out . --force
```

The distribution stays with the CLI on purpose. The CLI finds the workspace above the directory it
writes into and wires it: the style pipeline, the asset globs, the service worker, the one
production setting the content-security policy needs. The MCP server, by design, has no reach into
your workspace: it returns files and names the steps that remain, and your assistant does them.
That is the right shape for everything after the app exists, and the wrong one for the app itself,
where a missed step shows up as an unstyled page. [Who writes the
files](scaffolding.md#how-a-file-actually-gets-created) has the whole argument. An assistant with a
shell can of course run that CLI command for you; the tools earn their place from here on.

Register the server as above, open the project in your assistant, and ask for the first weaver.

## One run, as it happened

Recorded on 2026-09-08 with Claude Code 2.1.263 in headless mode, in a fresh `ng new` app taken
through the three commands above on platform 0.9.2, with the server pinned to the same version.
The raw capture is trimmed here to what the platform contributes; the assistant's own file reads
and its closing summary are left out, and nothing that remains was retyped.

The prompt:

> Add a weaver called notes with a command on mod+shift+n.

The assistant listed the project, read the `LOOMWEAVER.md` the distribution scaffold had left and
the composition root, and then called the tool:

```json
scaffold_weaver { "id": "notes", "shortcut": "mod+shift+n", "command": true }
```

The server answered with a file map and nothing else. The keys:

```
src/index.ts
src/lib/plugin/notes.plugin.ts
src/lib/plugin/notes.plugin.spec.ts
src/lib/views/notes-view.ts
src/lib/views/notes-view.html
src/lib/i18n/en.json
src/lib/i18n/de.json
README.md
```

Nothing had touched disk. The assistant chose `src/weavers/notes/` as the place and wrote seven of
the eight files there with its ordinary file tool. The eighth, the generated `README.md`, it read
instead of writing: that file lists the wiring a weaver needs, and the assistant used it as its
checklist. Then it made the three edits the checklist asks for. The composition root:

```ts
import {
  provideCapabilityGrants,
  provideCommandPaletteEntry,
  provideLayout,
  providePlugins,
  provideQuickOpenEntry,
  provideShell,
  provideShellRouter,
  provideTranslationNamespaces,
  type ShellLayout,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
import { notesPlugin } from '../weavers/notes';
```

```ts
    provideTranslationNamespaces('notes'),
    provideCapabilityGrants({ notes: ['contributions', 'ui', 'navigation'] }),
    ...providePlugins(notesPlugin),
```

And the build target in `angular.json`, so the weaver's strings are served:

```json
{
  "glob": "**/*.json",
  "input": "src/weavers/notes/lib/i18n",
  "output": "i18n/notes"
}
```

It then verified its own work without being asked: a development build, the manifest through
`validate_manifest`, which returned no findings, a look into `dist/` for the served bundle, and
the unit tests.

```
Application bundle generation complete. [1.654 seconds]
{"findings":[]}
de.json  en.json  notes
Test Files  3 passed (3)
     Tests  3 passed (3)
```

| The run          |                                                            |
| ---------------- | ---------------------------------------------------------- |
| Tool calls       | `scaffold_weaver`, `validate_manifest`                     |
| Files written    | seven under `src/weavers/notes/`                           |
| Files edited     | `src/app/app.config.ts`, `angular.json`                    |
| Turns, wall time | 22 turns, 74 seconds                                       |
| Afterwards       | `ng serve`: the icon is in the rail, `mod+shift+n` answers |

The same prompt was run a second time from the same clean state, and it reached the same tool.
What differed is what an assistant decides for itself: the second run kept the generator's
library layout under `src/weavers/notes/src/`, wrote the `README.md` as well, translated `de.json`
instead of leaving the English copy, and ran `validate_commands` on the result unprompted. Both
products served with the weaver in the rail.

## Prompts that reach the tools

Each prompt below was run twice through the same setup, from a product that already had the notes
weaver, and reached the tool named beside it both times. The wording is ordinary; what makes it
land is that the server describes its tools well enough for the assistant to pick the right one.
The last column is what was left for the reader when the assistant said it was done.

| Ask for                                                                                                             | The assistant calls       | What is left for you                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| _Add a weaver called invoices with a command and a settings section._                                               | `scaffold_weaver`         | the settings rows hold placeholder values; `de.json` is the English copy until you say otherwise                  |
| _Add a weaver called assistant with the AG-UI agent connection, so an agent can drive the workbench._               | `scaffold_weaver`         | the stand-in speaks the protocol on the first serve; your transport, key and model replace one file               |
| _Add a theme called ocean that I can edit the brand tokens in._                                                     | `scaffold_theme`          | the token values; the file is imported after the shell's theme and sits in the tenant layer already               |
| _Add a stand-in login so I can try access-gated contributions before the real auth exists._                         | `scaffold_auth_source`    | the real session source replaces one file; the `access` requirements on your own contributions are yours to write |
| _Store the settings in our REST API instead of local storage._                                                      | `scaffold_settings_store` | the endpoints under `/api/settings/<key>`; working state stays local by design                                    |
| _Check whether every command in this product is something an agent could call, and what it would have to guess at._ | `validate_commands`       | nothing to write; the answer names each command, whether it is offered, and what an agent could not know about it |
| _Translate the notes weaver into German and check that the two bundles stay in parity._                             | `validate_i18n`           | reading the translation; the parity check ran on the proposed bundles before the file was written                 |

Three things the runs showed that a page of prompts alone would not.

**The assistant verifies without being asked.** In every generating run it built the product and
ran the tests afterwards, and in most it also called a validator on its own output: the manifest,
the commands, the bundles. That is the point of validators that return findings rather than prose.

**It adapts the output to what it finds.** Given a product whose first weaver lives under
`src/weavers/notes/`, every later scaffold was placed beside it in the same folder shape, and the
generated files were adjusted to fit. The generator states structure, the assistant resolves it
against your layout, and that is by design.

**It notices what a scaffold forgets, and so did we.** The auth stand-in names two icons the shell
does not ship. The step that provides them is one the CLI performs and the MCP route, as of 0.9.2,
does not name. Both runs found the gap by reading the shell's type declarations and
contributed the icons from the plugin itself. A reader should not have to depend on that, so the
missing step is a defect in the tooling and is being fixed there; this page keeps the prompt because
the product that came out of it worked.

## Two stories, told apart

This page was about the first one: **an assistant building your product.** The platform is written
down for it, and the generators are tools it can call.

The platform tells a second story that is easy to confuse with the first: **a product driven by an
agent at runtime**. Every command a weaver registers with `callable: true` can be offered to an
agent speaking [AG-UI](https://docs.ag-ui.com), the open protocol between a user-facing application
and an agentic backend. The agent reaches only what the user at the keyboard could have reached.
That is a feature of the product you ship, not of the way you build it. [Driving your product with
an AG-UI agent](ag-ui-agents.md) is its guide. The
[assistant workbench](https://github.com/yesbert/loomweaver/tree/main/examples/assistant-workbench)
is its runnable case: a support inbox built on the published packages, where a real model opens,
assigns and answers tickets by calling the product's own commands. It asks before the one that
sends a reply.

The two meet in one place. A weaver generated with `--agent`, or asked for as one, is the first
story producing the second.

---

**Next:**

- [Scaffolding](scaffolding.md): every generator, every option, and who writes the files.
- [Samples](samples.md): the recipes the generator does not write, for the assistant to type.
- [Authoring a weaver](authoring-a-weaver.md): the contract behind what it just scaffolded.
