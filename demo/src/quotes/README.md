# Quotes weaver

A LoomWeaver weaver (a domain plugin bundle). It consumes only the public `@loomweaver/plugin-sdk` contract.

## Wire it into a distribution

1. Add the plugin to `providePlugins` in `src/app/app.config.ts`. It is **variadic** and
   returns an array, so spread it:

   ```ts
   import { quotesPlugin } from '@loomweaver/quotes-weaver';   // Nx: the workspace alias; without one, a relative path to this library's src/index.ts
   ...providePlugins(quotesPlugin),
   ```

2. Grant its capabilities (default-deny) via `provideCapabilityGrants`:

   ```ts
   provideCapabilityGrants({ 'quotes': ['contributions', 'navigation'] });
   ```

3. Compose its translations with `provideTranslationNamespaces('quotes')` — and serve the
   bundle by adding an assets glob to your application's build target, so the loader can fetch
   `/i18n/quotes/<lang>.json` (the Nx generator adds this glob for you):

   ```json
   { "glob": "**/*.json", "input": "<path to this library>/src/lib/i18n", "output": "i18n/quotes" }
   ```

4. If your application compiles the shell's theme with Tailwind, name this library as a source
   for it, so the utility classes in these templates are emitted. Tailwind also detects sources
   by itself, but that depends on where it resolves the project root and on `.gitignore`, and
   what the scaffold names covers the application alone (the Nx generator adds this line for
   you). Applications scaffolded with `--styles precompiled` run no Tailwind and need nothing:

   ```css
   @source '<path from that stylesheet to this library>/src';
   ```

The surface is routable at `/quotes`; rail and bar items reference region ids (`primary`, `status`) that must exist in your layout.

A routable surface has **no `VIEW_STATE` handle** — injecting the token there throws. It owns a URL,
so anything shareable (a filter, the active sub-tab) belongs in route params or `subRoutes`, where it
survives a deep link too; unsaved edits are `DirtySurface`, and an instance that is expensive to
rebuild declares `retain: 'always'`. Generate with `--instanceable` for the docked, `VIEW_STATE`
flavour instead.

## After scaffolding

- `src/lib/i18n/de.json` starts as a copy of the English strings — translate it.
- A scaffolded command defaults its shortcut to `mod+shift+<first letter of the id>` — two weavers whose ids share a first letter collide; pass `--shortcut` or edit the command.
- The project is generated **untagged**: Nx tags belong to your `depConstraints`, and inventing
  one would fail a lint policy you never opted this project into. If your workspace enforces
  module boundaries, give it tags your constraints allow — `--tags` at generation time, or
  `tags` in `project.json` afterwards.
