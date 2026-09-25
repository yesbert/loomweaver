# @loomweaver/plugin-sdk

The plugin contract of [LoomWeaver](https://loomweaver.dev). A plugin, called a weaver, imports this
package and nothing else from the platform: the `Plugin` it exports, the `ctx` it receives when it
activates, and the shapes of what it contributes through `ctx`, such as surfaces, commands, menu
entries and settings sections.

```ts
import { Plugin } from '@loomweaver/plugin-sdk';

export const notesWeaver: Plugin = {
  manifest: { id: 'notes', name: 'Notes', capabilities: ['contributions'] },
  activate(ctx) {
    ctx.registerCommand({ id: 'notes.new', title: 'notes.new', run: () => undefined });
  },
};
```

The manifest declares which capabilities the plugin needs, and the distribution decides which it
grants. A `ctx` member whose capability was not granted throws when it is called. Everything a plugin
registers is removed again when the plugin stops.

The package holds types and a few small values. Its one peer dependency is `@angular/core`, for the
component types a surface can name.

## Where to read on

- [Authoring a weaver](https://loomweaver.dev/authoring-a-weaver/): the shape of a weaver, and one
  how-to page per task from there
- [Frame surfaces](https://loomweaver.dev/weaver/sandboxed-surfaces/): a plugin that runs in an
  iframe and reaches `ctx` over RPC
- [Capabilities](https://loomweaver.dev/distribution/capabilities/): what a distribution grants and
  how a refusal reaches the user
