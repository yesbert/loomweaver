# Copilot weaver

A LoomWeaver weaver (a domain plugin bundle). It consumes only the public `@loomweaver/plugin-sdk` contract.

## Wire it into a distribution

1. Add the plugin to `providePlugins` in `src/app/app.config.ts`. It is **variadic** and
   returns an array, so spread it:

   ```ts
   import { copilotPlugin } from '@loomweaver/copilot-weaver';   // Nx: the workspace alias; without one, a relative path to this library's src/index.ts
   ...providePlugins(copilotPlugin),
   ```

2. Grant its capabilities (default-deny) via `provideCapabilityGrants`:

   ```ts
   provideCapabilityGrants({ 'copilot': ['contributions', 'ui', 'navigation', 'automation'] });
   ```

3. Compose its translations with `provideTranslationNamespaces('copilot')` — and serve the
   bundle by adding an assets glob to your application's build target, so the loader can fetch
   `/i18n/copilot/<lang>.json` (the Nx generator adds this glob for you):

   ```json
   { "glob": "**/*.json", "input": "<path to this library>/src/lib/i18n", "output": "i18n/copilot" }
   ```

4. If your application compiles the shell's theme with Tailwind, name this library as a source
   for it, so the utility classes in these templates are emitted. Tailwind also detects sources
   by itself, but that depends on where it resolves the project root and on `.gitignore`, and
   what the scaffold names covers the application alone (the Nx generator adds this line for
   you). Applications scaffolded with `--styles precompiled` run no Tailwind and need nothing:

   ```css
   @source '<path from that stylesheet to this library>/src';
   ```

The surface is routable at `/copilot`; rail and bar items reference region ids (`primary`, `status`) that must exist in your layout.

A routable surface has **no `VIEW_STATE` handle** — injecting the token there throws. It owns a URL,
so anything shareable (a filter, the active sub-tab) belongs in route params or `subRoutes`, where it
survives a deep link too; unsaved edits are `DirtySurface`, and an instance that is expensive to
rebuild declares `retain: 'always'`. Generate with `--instanceable` for the docked, `VIEW_STATE`
flavour instead.

## The agent connection

`src/lib/agent/` holds three files and one of them is meant to be thrown away.

- `copilot-agent.ts` is the connection: the workbench's own commands offered as tools, and a
  seam where this weaver decides about a call before it runs. Nothing is registered twice — the
  list comes from the workbench, already narrowed by everything that would refuse the call.
- `copilot-agent-panel.ts` shows what is offered, the call as it streams, and the outcome.
- `copilot-agent-source.ts` is a **stand-in**, not an assistant: it produces the protocol's own
  events so the whole path runs before you have connected anything. Replace that one file with
  your transport and nothing else changes. No transport, credential or model is generated for
  you, because none of them can be guessed.

Three things are easy to get wrong and invisible when they are, so the generated code does them
rather than explaining them: the offered list is asked for again every run, every event is handed
over unfiltered, and a decision before a call can only narrow what the workbench would have
allowed anyway.

The generated weaver needs two packages your project may not carry yet:

```bash
npm i @loomweaver/ag-ui @ag-ui/core
```

The Nx generator and the CLI record them for you; the MCP route names them instead.

## After scaffolding

- `src/lib/i18n/de.json` starts as a copy of the English strings — translate it.
- A scaffolded command defaults its shortcut to `mod+shift+<first letter of the id>` — two weavers whose ids share a first letter collide; pass `--shortcut` or edit the command.
- The project is generated **untagged**: Nx tags belong to your `depConstraints`, and inventing
  one would fail a lint policy you never opted this project into. If your workspace enforces
  module boundaries, give it tags your constraints allow — `--tags` at generation time, or
  `tags` in `project.json` afterwards.
