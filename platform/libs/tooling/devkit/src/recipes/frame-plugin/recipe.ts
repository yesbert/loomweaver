import { FileMap, Recipe } from '../../lib/generate/types';
import { isKebabId, toTitleCase } from '../../lib/generate/casing';

export interface FramePluginInput {
  readonly id: string;
  readonly name?: string;
}

export interface ResolvedFramePlugin {
  readonly id: string;
  readonly name: string;
}

export function resolveFramePluginInput(input: FramePluginInput): ResolvedFramePlugin {
  if (!isKebabId(input.id)) {
    throw new Error(`Frame plugin id must be kebab-case (e.g. "notes"); got "${input.id}".`);
  }
  return { id: input.id, name: input.name?.trim() || toTitleCase(input.id) };
}

function pluginHtml(plugin: ResolvedFramePlugin): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${plugin.name} — frame plugin (logic)</title>
  </head>
  <body>
    <script src="/frame-kit/penpal.global.js"></script>
    <script src="./plugin.js"></script>
  </body>
</html>
`;
}

function pluginJs(plugin: ResolvedFramePlugin): string {
  return `(function () {
  const Penpal = globalThis.Penpal;
  const messenger = new Penpal.WindowMessenger({
    remoteWindow: globalThis.parent,
    allowedOrigins: ['*'],
  });
  const connection = Penpal.connect({ messenger });

  connection.promise
    .then(function (ctx) {
      return Promise.all([
        ctx.toast({ message: '${plugin.name} ready', kind: 'success', timeoutMs: 4000 }),
        ctx.registerSurface({
          id: '${plugin.id}.view',
          title: '${plugin.name}',
          iframe: '/${plugin.id}/view.html',
          routable: { path: '${plugin.id}', titleIsLiteral: true },
        }),
      ]);
    })
    .catch(function (error) {
      console.error('[${plugin.id}] frame plugin failed', error);
    });
})();
`;
}

function viewHtml(plugin: ResolvedFramePlugin): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${plugin.name}</title>
    <link rel="stylesheet" href="/frame-kit/lw-frame.css" />
    <style>
      body {
        margin: 0;
        font-family: var(--lw-font-sans, system-ui, sans-serif);
        color: var(--lw-content, #1f2937);
        background: var(--lw-surface, transparent);
      }
      .wrap { max-width: 42rem; margin: 0 auto; padding: 1.5rem; }
      h1 { font-size: 1.125rem; font-weight: 600; }
      p { color: var(--lw-content-faint, #6b7280); }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>${plugin.name}</h1>
      <p>
        Your sandboxed surface. It runs isolated in its own iframe, so its body can be built with
        any framework (React, Vue, Svelte, vanilla). The frame UI kit (served by the distribution
        under <code>/frame-kit/</code>) defines the <code>lw-*</code> element family and
        the <code>.lw-*</code> class contracts; the host pushes its resolved design tokens over RPC.
      </p>
      <p><lw-button variant="primary" size="sm">Kit button</lw-button></p>
    </div>
    <script src="/frame-kit/penpal.global.js"></script>
    <script src="/frame-kit/lw-elements.global.js"></script>
    <script>
      globalThis.Penpal.connect({
        messenger: new globalThis.Penpal.WindowMessenger({
          remoteWindow: globalThis.parent,
          allowedOrigins: ['*'],
        }),
        methods: {
          render: function (state) {
            globalThis.LwFrame.applySurfaceState(state);
          },
        },
      });
    </script>
  </body>
</html>
`;
}

function readme(plugin: ResolvedFramePlugin): string {
  return [
    `# ${plugin.name} — frame plugin`,
    '',
    `A framework-agnostic LoomWeaver plugin: it runs in an isolated \`<iframe sandbox>\` and`,
    `receives \`ctx\` over Penpal RPC through the same default-deny broker a trusted plugin uses.`,
    '',
    '## Serve it + wire it into a distribution',
    '',
    `1. Put these files under the distribution's static dir, e.g. \`public/${plugin.id}/\`. The plugin`,
    `   references the **frame UI kit** (\`@loomweaver/frame-kit\`) at \`/frame-kit/\` —`,
    `   the distribution serves it via an assets glob (generated distributions already do):`,
    '',
    '   ```jsonc',
    '   { "input": "node_modules/@loomweaver/frame-kit/dist", "glob": "**", "output": "frame-kit" }',
    '   ```',
    '',
    `2. Register + grant it in the composition root:`,
    '',
    '   ```ts',
    `   provideFramePlugins({ id: '${plugin.id}', entryUrl: '/${plugin.id}/plugin.html', capabilities: ['contributions', 'ui'] });`,
    `   provideCapabilityGrants({ '${plugin.id}': ['contributions', 'ui'] });`,
    '   ```',
    '',
    `The surface is routable at \`/${plugin.id}\`. Replace \`view.html\` with your own UI in any framework.`,
    '',
  ].join('\n');
}

export const framePlugin: Recipe<FramePluginInput> = {
  id: 'frame-plugin',
  build(input: FramePluginInput): FileMap {
    const plugin = resolveFramePluginInput(input);
    return {
      'plugin.html': pluginHtml(plugin),
      'plugin.js': pluginJs(plugin),
      'view.html': viewHtml(plugin),
      'README.md': readme(plugin),
    };
  },
};
