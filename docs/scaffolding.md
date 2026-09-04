# Scaffolding

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `scaffolding`. Where this page and a specification disagree,
> the specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

LoomWeaver ships its own generators. They exist because the platform is easy to *use* and fiddly to
*wire up*. Before a weaver does anything at all, it needs a manifest, a surface, an i18n bundle and
the right capability declaration. Getting one of those wrong fails quietly. The generators emit all
of it consistently. They also derive the capabilities from the features you ask for. A scaffolded
plugin is therefore correct by construction rather than by review.

## First: the tool is not a dependency

Two different things carry a `@loomweaver` name, and only one of them belongs in your application:

| | Package | Installed where | Purpose |
| --- | --- | --- | --- |
| **Runtime** | `@loomweaver/shell`, `@loomweaver/plugin-sdk`, `@loomweaver/frame-kit` | your app's `dependencies` | your app boots the shell with them |
| **Tool** | `@loomweaver/cli`, `@loomweaver/mcp` | **nowhere in your app** — run on demand, or registered with your assistant | generate source files |
| **Tool (Nx)** | `@loomweaver/devkit` | your workspace's `devDependencies` | adds `nx g` generators |

Only the Nx collection is installed, and only as a dev dependency, because Nx loads generators from
`node_modules`. The other two run as separate processes and know nothing about your codebase.

Which tool depends on how you want to drive it:

| You want… | Use | |
| --- | --- | --- |
| an Nx workspace to generate the way it generates everything else | **`@loomweaver/devkit`** | writes into the workspace and registers the project |
| a command you can run, script and put in CI | **`@loomweaver/cli`** | deterministic, no workspace of any kind |
| to ask in prose and let an assistant fill in the options | **`@loomweaver/mcp`** | your assistant writes the files |

All three read the same scaffold descriptors and call the same generator core, so a weaver scaffolded
any of the three ways has byte-identical source. What differs is what each one is allowed to do with
the result — see [who writes the files](#how-a-file-actually-gets-created).

## The CLI — `@loomweaver/cli`

It needs nothing installed — the generators are bundled in. It runs without a workspace too; where
it finds one it also wires the build, and where it does not it names what is left:

```bash
npx @loomweaver/cli weaver --id notes --command --shortcut 'mod+shift+n' --out src/lib/notes
```

```
Wrote 8 file(s) into /home/you/acme-studio/src/lib/notes:
  README.md
  src/index.ts
  src/lib/i18n/de.json
  …
Wired 3 workspace file(s):
  src/styles.css
    + @source 'lib/notes/src'
  src/app/app.config.ts
    + notesPlugin, its translations and its capability grants
  angular.json
    + assets: src/lib/notes/src/lib/i18n
```

It finds the workspace by walking up from `--out`, so it wires the build as well as writing the
files. `--dry-run` previews both and writes nothing.

`loomweaver list` prints every scaffold with its options. `loomweaver --help` prints everything else. The
version matches the platform packages, so the output always fits the `@loomweaver/shell` you build
against.

Three scaffolds carry options worth knowing before you read that list. The
[weaver](#the-weaver-generator) composes its features from flags. The other two decide how your
product is styled, and they work together:

| Flag | What it changes |
| --- | --- |
| `distribution --styles precompiled` | emits a one-line `src/styles.css` that imports the stylesheet **we** compiled, so the application needs **no Tailwind** — no packages, no `.postcssrc.json`, no `@source` hops. The default, `tailwind`, compiles the shell's source theme and is what lets you write Tailwind utilities of your own |
| `theme --preset bootstrap` | maps all 29 `--lw-*` tokens onto Bootstrap 5.3's `--bs-*` variables instead of emitting literal colours, so the shell follows your Bootstrap theme live |

Together they are the whole Bootstrap path, and the framework itself has to go into a cascade layer:
[Bringing your own CSS framework](distribution/css-frameworks.md) has the import order and the mapping.

| Option | Effect |
| --- | --- |
| `--out <dir>` | where to write; defaults to the current directory |
| `--dry-run` | list the files it would write — naming any that already exist — and write nothing |
| `--force` | overwrite files that already exist — without it, an existing file stops the run and is named |
| `--strict` | make validation warnings fail the exit code, for CI |

The three validators work the same way, which is what makes them useful in a pipeline:

```bash
npx @loomweaver/cli validate-manifest --id notes --capabilities ui,contributions
npx @loomweaver/cli validate-i18n --dir src/lib/notes/src/lib/i18n --strict
npx @loomweaver/cli validate-catalog --file public/plugins/catalog.json --strict
```

A missing translation key is a *warning*: it reports and exits 0, so it will not break an unrelated
build. `--strict` turns warnings into a non-zero exit when you do want to gate on parity.

`validate-catalog` earns its place for one reason: the shell parses a
[plugin store catalogue](distribution/plugin-store.md) **defensively** —
it tolerates bad input instead of failing on it. A field it does not recognise is skipped. A
malformed field is dropped. An entry missing `id` or `entryUrl` disappears entirely. All of this
happens without a word, because a store that throws on one bad entry serves nobody. That is the
right runtime behaviour, and a terrible authoring experience. So every finding names the
consequence rather than the rule:

```
error: catalog[0].capabilities contains "uii", which the host filters out silently — the plugin
       then throws CapabilityError at runtime. Known: contributions, ui, host, navigation, session, theme, automation.
warning: catalog[0].discription is not one of the fields the host reads (…), so it is ignored
       without a word — which is exactly what a misspelled field looks like.
warning: catalog[1] carries no version. Update detection compares catalog versions, so the store
       can never offer an update and republishing the plugin will not respawn it for anyone who
       already installed it.
```

The one thing it cannot judge from outside a browser is whether an **absolute** URL is same-origin.
It does not know the origin you will serve from. So it reports absolute URLs as warnings. It leaves
root-relative paths alone, because those are same-origin by construction.

## The MCP server — `@loomweaver/mcp`

Same generators, driven by conversation rather than by flags: you describe what you want and your
assistant picks the options. Where the CLI writes the files itself, here **your assistant does** —
see [how a file actually gets created](#how-a-file-actually-gets-created) below.

`@loomweaver/mcp` is a self-contained [Model Context Protocol](https://modelcontextprotocol.io/) server —
the generators and validators are bundled in, so there is no transitive install and no LoomWeaver
checkout. Register it in your repository's `.mcp.json` and your AI assistant gains the tools:

```json
{
  "mcpServers": {
    "loomweaver": { "command": "npx", "args": ["-y", "@loomweaver/mcp"] }
  }
}
```

The server speaks stdio and reports its version on connect, so the tools always match the platform
version you are building against.

<a id="how-a-file-actually-gets-created"></a>

### How a file actually gets created

**`scaffold_*` tools do not write files.** They return a file map — relative path to content — and
your assistant writes it:

```json
{ "files": { "src/index.ts": "…", "src/lib/plugin/notes.plugin.ts": "…" } }
```

End to end, asking for a plugin looks like this:

1. You ask your assistant for a weaver — say a `notes` plugin with a command on `mod+shift+n`.
2. It calls `scaffold_weaver { "id": "notes", "command": true, "shortcut": "mod+shift+n" }`.
3. The server generates in memory and answers with the file map. **Nothing has touched disk.**
4. Your assistant picks the target directory and writes each file with its ordinary file-writing
   tool — so this is where your usual permission prompt or diff review appears.
5. You do the wiring the generated README lists: grant the declared capabilities, compose the
   translations, translate `de.json`.

Three consequences worth knowing:

- **You choose where the files land.** The paths in the map are relative. The server has no idea
  whether you run a monorepo, where your library root is, or what your projects are called — so it
  states structure, not location, and your assistant resolves it against your layout.
- **Nothing reaches disk except through your client.** A server started via `npx` is code you did
  not audit. Because it returns data instead of writing files, it stays inside the review path you
  already have. It never gets a write path of its own.
- **The same generator core serves every path.** The core is a pure function: it takes input and
  returns *two* things, the file contents to write and a statement of what the workspace around them
  must carry for them to work. It has no filesystem access at all. The CLI, the MCP server and the
  Nx generator are thin adapters over it, which is why they cannot drift apart, and why the core
  itself never writes anything.

That second product is what keeps a scaffold honest. Sources alone do not run: a stylesheet needs a
style pipeline, the chrome needs its strings served, a release build needs a setting its own
content-security policy demands. Stating those as data means each adapter applies as much of it as
its position allows, and **says what it could not do** rather than leaving a reader to discover it
in the browser.

Every amendment is an *ensure this is present*, never a *set this to*. Running a scaffold twice
changes nothing, and a value you chose yourself is never overruled.

| Adapter | Writes files? | Amends the workspace? | Because |
| --- | --- | --- | --- |
| `@loomweaver/devkit` (Nx) | yes | yes — the project registration, the tsconfig alias, the build target, the style pipeline, a package the output needs | Nx hands it a virtual tree of your workspace |
| `@loomweaver/cli` | yes | yes — the style pipeline, the build target, the entry stylesheet, the composition root, a package the output needs | it finds the workspace above the target directory it was given |
| `@loomweaver/mcp` | no | no — it names each step instead, with what it costs to skip | it returns relative paths so your client stays in the review path |

The files a route amends are ones it names for itself, never ones derived from what you passed on
the command line: the refusal to write outside the target directory governs supplied targets and is
unchanged.

**`validate_*` tools return findings**, not prose, so an assistant can act on them:

```json
{
  "findings": [
    {
      "level": "error",
      "code": "manifest.id",
      "message": "Plugin id must be a kebab-case string; got \"Notes\".",
      "path": "manifest.id"
    }
  ]
}
```

### The tools

| Tool | Arguments | Gives you |
| --- | --- | --- |
| `list_generators` | — | the available generators and what they emit |
| `scaffold_weaver` | see [below](#weaver-options) | a complete plugin: manifest, surface, rail item, i18n, test |
| `scaffold_frame_plugin` | `id`, `name` | a framework-agnostic iframe plugin (Penpal + the frame UI kit) |
| `scaffold_distribution` | `name`, `title`, `styles` | a runnable composition root that boots the shell |
| `scaffold_auth_source` | `name` | an `AuthSource` implementation to feed the session |
| `scaffold_settings_store` | `name` | a settings-store implementation backed by your API |
| `scaffold_theme` | `name`, `preset` | a token-override stylesheet in `@layer lw-tenant-theme` |
| `scaffold_layout` | `name` | a `ShellLayout` with the regions a weaver expects |
| `validate_manifest` | `id`, `name`, `capabilities` | findings on a plugin manifest |
| `validate_catalog` | `catalog` — the parsed catalogue JSON array | findings on a plugin store catalogue, including fields the host never reads |
| `validate_i18n` | `bundles` — the parsed language files keyed by language, e.g. `{ "en": { "notes.list": "Notes" }, "de": { "notes.list": "Notizen" } }` | findings on translation-bundle parity (keys missing in one language) |

## The weaver generator

This is the one you will use most, and the only one with real options. Each feature you switch on
pulls in what it needs — ask for a command and the `ui` capability is declared for you; ask for an
About dialog and `host` comes with it.

<a id="weaver-options"></a>

The CLI spells these as flags (`--bar-item`) and MCP as arguments (`barItem`); they are the same
option, so the table gives both.

| CLI flag | MCP argument | Effect |
| --- | --- | --- |
| `--id <id>` **required** | `id` | plugin id in kebab-case, e.g. `notes` |
| `--name <name>` | `name` | display name; defaults to a title-cased `id` |
| `--command` | `command` | also register a command; its `run` raises a toast — a placeholder action on a real shortcut |
| `--shortcut <chord>` | `shortcut` | keyboard chord for it, e.g. `mod+shift+n` (implies `command`) |
| `--menu <slot>` | `menu` | hook a menu item into a slot, e.g. `content/tab/context` (implies `command`) |
| `--bar-item` | `barItem` | a status-bar button that triggers the command (implies `command`) |
| `--settings` | `settings` | a settings section with a toggle and a text field |
| `--about` | `about` | an About dialog that reads `ctx.host`, plus its command |
| `--instanceable` | `instanceable` | named saved instances with a switcher — this **docks** the surface instead of routing it (see below) |
| `--container` | `container` | make the surface a [container](#container-surfaces): a routable tab holding a nested pane tree |
| `--agent` | `agent` | wire the weaver up for an [AG-UI agent](#the-agent-connection) to drive: a docked panel, the seam that decides about a call before it runs, and a stand-in that works on the first serve (implies `command`) |
| `--access <req>` | `access` | auth-gate the surface and rail item: `authenticated`, `anonymous`, or a role requirement |
| `--no-spec` | `spec: false` | skip the starter unit test, which is generated by default |

`--instanceable` and `--container` shape the surface itself and are therefore mutually exclusive; the
generator says so rather than emitting something that quietly does nothing.

Write shortcuts with the **`mod`** token rather than `cmd` or `ctrl`: the host binds and displays it
per platform (⌘ on macOS, Ctrl elsewhere).

Either way — `loomweaver weaver --id notes --command --shortcut 'mod+shift+n'`, or the MCP argument
`{ "id": "notes", "command": true, "shortcut": "mod+shift+n" }` — you get the same eight files:

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

No test setup file: the recipes emit no project infrastructure, because a runner is the workspace's
choice, not a plugin's. The Nx generator wires `@nx/angular:unit-test` (Vitest) for you; elsewhere the
spec runs under whatever your application already uses.

The generated README lists the three steps that are easy to miss. First, grant the plugin's
declared capabilities via `provideCapabilityGrants`. The broker is default-deny, so an ungranted
plugin activates into a `CapabilityError` rather than silently doing nothing. Second, compose its
translations with `provideTranslationNamespaces`. Third, translate `de.json`, which starts as a
copy of the English strings.

<a id="the-agent-connection"></a>

### The agent connection

`--agent` generates what it takes for an assistant speaking the AG-UI protocol to run the commands
your workbench offers, and it generates it **working**: serve the product and the whole path runs,
from the offered list through a streamed call to its outcome, with no backend, no key and no network.

Three files land under `src/lib/agent/`:

- `<id>-agent.ts` — the connection. The workbench's own commands become the tools, and a call comes
  back through the same seam every other trigger runs through. It also carries the place where your
  product says no before a call runs; the generated weaver names its own command as consequential, as
  an example to replace with the ones that actually cost something.
- `<id>-agent-panel.ts` — a docked panel showing what is offered, the call as its arguments stream in,
  and what came back.
- `<id>-agent-source.ts` — a **stand-in**, and it says so where you cannot miss it. It produces the
  protocol's own events and nothing else. Replace that one file with your transport; the panel and the
  connection stay as they are. Nothing is generated for the transport, the credentials or the model,
  because none of those can be guessed.

What the connection guarantees, which calls to ask about and how to replace the stand-in is
[Driving your product with an AG-UI agent](ag-ui-agents.md#generate-it); that page also names the
two packages `--agent` needs and the `automation` capability it derives.

### Three shapes of surface

The default surface is **routable**: it lives at `/<id>`, holds the address pane, and is what a deep link
and the browser's back button address. Two flags trade that for something else.

`--instanceable` **docks** the surface into the left panel (`left-panel` in the scaffolded layout) and
drops `routable`. That is not
a detail. Named instances exist only for a docked surface; a routable surface holds the address pane
instead. The rail item then reveals the surface (`ctx.revealSurface`) rather than navigating to it.
Revealing also means the rail item finds the surface wherever the user has since dragged it.

<a id="container-surfaces"></a>

`--container` goes the other way and makes the surface *more* routable: a container tab lives at
`/<id>/:id` and holds a **nested pane tree** of child surfaces.
The host draws the inner tabs, splits and drop targets; the weaver only declares which children it
offers:

```ts
// src/lib/plugin/notes.plugin.ts
ctx.registerSurface({
  id: 'notes',
  title: 'notes.title',
  icon: 'notes',
  routable: { path: 'notes/:id' },
  container: {
    children: ['notes.canvas', 'notes.details'],
    initial: ['notes.canvas', 'notes.details'],
  },
});

ctx.registerSurface({
  id: 'notes.canvas',
  title: 'notes.canvas',
  docks: [],
  component: NotesCanvasView,
});
```

`children` is what the inner "new tab" picker lists; the host access-gates that list. `initial` is
what a freshly opened container tab starts with. The children declare `docks: []`. That is the
container-only convention: it keeps them out of every sidebar and picker except this container's.

A child reads the container's `:id` from an injected `ActivatedRoute`. The host supplies a synthetic
one, so the child needs no knowledge of where it is mounted, and two open container tabs are two
independent trees:

```ts
// src/lib/views/notes-canvas-view.ts
private readonly route = inject(ActivatedRoute, { optional: true });
protected readonly instanceId = this.route?.snapshot.paramMap.get('id') ?? '—';
```

The inner tree is **sealed**: nothing can be dragged out of it and nothing into it. It travels with
the tab — including into a sidebar or a pop-out window.

## The Nx generators — `@loomweaver/devkit`

If your workspace is an Nx workspace, this is the fullest of the three. It is the only adapter that
can *change* files as well as write them, because Nx hands it a virtual tree of your workspace. It
registers the project and adds the tsconfig path alias. The other two adapters can only describe
those steps.

```bash
npm i -D @loomweaver/devkit
# what the generated source imports — see step 2 of the quickstart for the version pin
npm i @loomweaver/shell @loomweaver/plugin-sdk @angular/cdk @jsverse/transloco @ng-icons/heroicons
# only for a distribution on the default --styles tailwind; `precompiled` needs none of these
npm i -D tailwindcss @tailwindcss/postcss @tailwindcss/typography

nx g @loomweaver/devkit:weaver --id notes --command --shortcut 'mod+shift+n'
nx g @loomweaver/devkit:distribution --name acme-studio --title 'Acme Studio' --styles precompiled
nx g @loomweaver/devkit:frame-plugin --id charts
nx g @loomweaver/devkit:auth-source --name acme
nx g @loomweaver/devkit:settings-store --name backend
nx g @loomweaver/devkit:theme --name midnight --preset bootstrap
nx g @loomweaver/devkit:layout --name base
```

An Nx application usually exists before LoomWeaver does, since `nx g @nx/angular:application` is how
one comes into being. To compose into it, name it and pass `--force`:

```bash
nx g @loomweaver/devkit:distribution --name acme-studio --directory apps/acme-studio --force
```

That replaces the bootstrap files this scaffold owns, and it merges the scaffold's build targets
into the project. The wiring the shell needs lands this way: the i18n and frame-kit assets, the
stylesheet, the service worker, and `inlineCritical: false`. What the application already declares
is not discarded — its own targets, its `implicitDependencies` and its tags survive. The generator
refuses to rename a project. If the occupant is called something else, pass that name instead,
because renaming would break every reference to it.

It reads your workspace rather than assuming ours:

| It needs to know | How it decides |
| --- | --- |
| where the project goes | `--directory`, defaulting to `libs/<project name>` |
| what to call the import alias | `--import-path`, defaulting to your root manifest's npm scope |
| which application to drop into | `--app`; with one **buildable** application it is inferred, and with several it fails naming them rather than guessing. E2E projects are applications to Nx but build nothing, so they are never candidates — otherwise the usual `<app>` + `<app>-e2e` pair would defeat inference |
| Nx tags and the selector prefix | `--tags` and `--prefix` — the prefix is carried into the generated component selectors. Without `--tags` a project is generated untagged, because tag names only mean something inside your own `depConstraints`; see [LoomWeaver and Nx](manual-setup.md#loomweaver-and-nx) |
| how deep the project sits | derived from the directory, not hard-coded |
| serving the weaver's translations | an assets glob for `/i18n/<id>/` is added to the composing application's build |
| styling the weaver's templates | a `@source` for the new library is appended to the composing application's entry stylesheet, so its utilities are emitted. Tailwind 4 also detects sources by itself, and in a plain workspace that already reaches a sibling library — but that detection depends on where it resolves the project root and on `.gitignore`, and the scaffolded `@source './'` names the application alone. Left untouched when the application runs no Tailwind, as with `--styles precompiled`. The other two adapters write no foreign files, so there it is a step in the generated `README.md` |

The generated test target is `@nx/angular:unit-test` (Vitest), which is what Angular 21+ and Nx both
default to. A weaver library has no build of its own, so its specs compile with the build options of
the application that composes it — that is what `--app` resolves. If your workspace runs a different
runner, `--unit-test-runner none` emits no test wiring at all and leaves it to you.

Inside this repository the same collection is used through the workspace path alias, with the
placement passed explicitly:

```bash
cd platform
nx g @loomweaver/devkit:weaver --id notes --directory libs/weavers/notes-weaver \
  --import-path @loomweaver/notes-weaver --app loom-testbed
```

To point an MCP client at a local build rather than the published package:

```bash
cd platform && nx bundle mcp
```

```json
{
  "mcpServers": {
    "loomweaver": { "command": "node", "args": ["platform/libs/tooling/mcp/dist/main.mjs"] }
  }
}
```

---

**Next:** [Authoring a weaver](authoring-a-weaver.md) — what to do with the plugin once it exists.
