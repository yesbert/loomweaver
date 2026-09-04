# Icons, translations and rewording

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `i18n` · `theming`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Three things a distribution changes about the words and glyphs the chrome shows: which icon a name renders, which translation namespaces exist, and what the shell's own strings say.

## Icons

The shell ships a small first-party icon set. `provideIcons` — re-exported from `@loomweaver/shell` —
does two jobs: it adds names the shell lacks, and it **replaces** the ones it ships, which is how a
product re-skins the workbench in its own hand:

```ts
// src/app/app.config.ts — in the providers array
import { provideIcons } from '@loomweaver/shell';
import { heroDocumentText } from '@ng-icons/heroicons/outline';

// in providers:
provideIcons({
  report: heroDocumentText,          // a name we do not ship
  brandMark: '<svg …>…</svg>',
  trash: '<svg …>…</svg>',           // replaces ours everywhere the chrome draws it
}),
```

Values are `@ng-icons` refs or raw SVG strings. Naming one of the shipped icons replaces it in the
rail, the sidebars, tabs, menus, dialogs, settings and the command palette, and it also travels into
**sandboxed surfaces**, so a plugin drawing `<lw-icon name="trash">` shows your glyph rather than
ours and one screen never carries two icon sets. The key type suggests the shipped names, so a typo
in an intended replacement shows up while you write it instead of quietly adding a glyph nothing
draws; `LoomIconName` is exported if you want to name them in your own code.

A **weaver** instead brings icons at runtime with
[`ctx.contributeIcons`](../weaver/icons-and-theme.md#custom-icons--ctxcontributeicons), and a weaver
contribution can never shadow a first-party or distribution name — otherwise an installed plugin
could repaint your chrome.

## i18n

Three layers compose, and none can clobber another:

- **Host keys** come from `@loomweaver/shell` at `/i18n/{lang}.json` (serve them — see
  [getting started §5](../getting-started.md)).
- **Each namespace** you register with `provideTranslationNamespaces('notes', 'product')` loads from
  `/i18n/<name>/{lang}.json` and nests under `<name>.*`. Your weaver owns `notes.*`; your branding
  owns `product.*`.
- **Overrides** you opt into with `provideTranslationOverrides()` are applied last, key by key, and
  are the only layer that may change a host string; see [Rewording the shell](#rewording-the-shell).

Serve the namespace files as assets (`public/i18n/notes/en.json`, `public/i18n/product/en.json`) and
copy the shell's host keys (getting-started §5). A namespace file does **not** repeat its namespace —
the loader nests it under the name:

```jsonc
// public/i18n/product/en.json
{ "tagline": "Weave anything" }   // → resolved as product.tagline
```

## Rewording the shell

Namespaces let you _add_ strings and can never collide with a host key, which is what keeps a plugin
from renaming your Cancel button. Rewording the shell itself is the opposite job, so it is a separate,
deliberate opt-in: call `provideTranslationOverrides()` and serve
`public/i18n/overrides/{lang}.json`.

```jsonc
// public/i18n/overrides/en.json
{ "workspace": { "saveAs": "Save as" } }   // ours reads "Save as new"
```

The overlay is merged **key by key**, so you name only the strings you want to change and inherit
everything else — including every key a later release adds. That is the point: forking our bundle
would leave you quietly behind on each update. It is applied last, so it also reaches the strings of a
weaver you bundle.

In development the shell says something when the overlay cannot help: a language with no overlay file
keeps its shipped strings and is logged, and a key the overlay names but nothing ships is logged too,
since that is otherwise a string that simply never appears.

### More than one wording in one build

`provideTranslationOverrides()` takes an optional directory, so a single build can carry several
wordings and pick one while composing — a white-label distribution serving three brands, or a demo
that switches product:

```ts
// src/app/app.config.ts
provideTranslationOverrides(`/i18n/overrides/${brand}`),   // → /i18n/overrides/acme/en.json
```

You probably do not need this. The default path is same-origin, so a product **with a backend** can
already serve different bytes there per tenant, which keeps the choice on the server where the tenant
is known. The argument is for the static case, where the bytes are fixed at deploy time and the choice
has to happen in the composition root.

## Where next

- [Branding](branding.md): the identity and the `--lw-*` tokens beside these icons and strings.
- [Icons and theme](../weaver/icons-and-theme.md): `ctx.contributeIcons`, the icons a weaver brings at runtime.
- [Translations](../weaver/i18n.md): how a weaver fills the namespace you registered for it.
