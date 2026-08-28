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
    throw new Error(`Sandbox plugin id must be kebab-case (e.g. "notes"); got "${input.id}".`);
  }
  return { id: input.id, name: input.name?.trim() || toTitleCase(input.id) };
}

function pluginHtml(p: ResolvedFramePlugin): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${p.name} — frame plugin (logic)</title>
  </head>
  <body>
    <script src="/frame-kit/penpal.global.js"></script>
    <script src="./plugin.js"></script>
  </body>
</html>
`;
}

function pluginJs(p: ResolvedFramePlugin): string {
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
        ctx.toast({ message: '${p.name} ready', kind: 'success', timeoutMs: 4000 }),
        ctx.registerSurface({
          id: '${p.id}.view',
          title: '${p.name}',
          iframe: '/${p.id}/view.html',
          routable: { path: '${p.id}', titleIsLiteral: true },
        }),
      ]);
    })
    .catch(function (error) {
      console.error('[${p.id}] frame plugin failed', error);
    });
})();
`;
}

function viewHtml(p: ResolvedFramePlugin): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${p.name}</title>
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
      <h1>${p.name}</h1>
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

function readme(p: ResolvedFramePlugin): string {
  return [
    `# ${p.name} — frame plugin`,
    '',
    `A framework-agnostic LoomWeaver plugin: it runs in an isolated \`<iframe sandbox>\` and`,
    `receives \`ctx\` over Penpal RPC through the same default-deny broker a trusted plugin uses.`,
    '',
    '## Serve it + wire it into a distribution',
    '',
    `1. Put these files under the distribution's static dir, e.g. \`public/${p.id}/\`. The plugin`,
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
    `   provideFramePlugins({ id: '${p.id}', entryUrl: '/${p.id}/plugin.html', capabilities: ['contributions', 'ui'] });`,
    `   provideCapabilityGrants({ '${p.id}': ['contributions', 'ui'] });`,
    '   ```',
    '',
    `The surface is routable at \`/${p.id}\`. Replace \`view.html\` with your own UI in any framework.`,
    '',
  ].join('\n');
}

export const framePlugin: Recipe<FramePluginInput> = {
  id: 'frame-plugin',
  build(input: FramePluginInput): FileMap {
    const p = resolveFramePluginInput(input);
    return {
      'plugin.html': pluginHtml(p),
      'plugin.js': pluginJs(p),
      'view.html': viewHtml(p),
      'README.md': readme(p),
    };
  },
};
