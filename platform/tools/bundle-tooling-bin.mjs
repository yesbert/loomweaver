import { build } from 'esbuild';
import { chmodSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// What both builds below share, so the build that reports what a bin inlines is the build that
// produces the bin.
function bundleOf(scriptUrl) {
  const at = (relative) => fileURLToPath(new URL(relative, scriptUrl));
  return {
    at,
    options: {
      entryPoints: [at('src/main.ts')],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      alias: { '@loomweaver/devkit': at('../devkit/src/index.ts') },
    },
  };
}

export async function bundleBin(scriptUrl, versionVariable) {
  const { at, options } = bundleOf(scriptUrl);
  const outfile = at('dist/main.mjs');
  const { version } = JSON.parse(readFileSync(at('package.json'), 'utf8'));
  await build({
    ...options,
    outfile,
    banner: { js: '#!/usr/bin/env node' },
    define: { [`process.env.${versionVariable}`]: JSON.stringify(version) },
  });
  chmodSync(outfile, 0o755);
}

// The folder of every package the bin carries inside itself. A bin publishes with no dependencies
// of its own, so what esbuild inlines ships under our name and is nobody's production dependency:
// the licence check reads this list to see it anyway. Only files that left bytes in the output
// count, which leaves out what tree-shaking dropped. Nothing is written.
export async function inlinedPackageFolders(scriptUrl) {
  const { at, options } = bundleOf(scriptUrl);
  const root = at('.');
  const { metafile } = await build({
    ...options,
    absWorkingDir: root,
    outfile: at('dist/main.mjs'),
    write: false,
    metafile: true,
    logLevel: 'silent',
  });
  const folders = new Set();
  for (const output of Object.values(metafile.outputs)) {
    for (const [input, { bytesInOutput }] of Object.entries(output.inputs)) {
      const marker = input.lastIndexOf('node_modules/');
      if (bytesInOutput === 0 || marker === -1) continue;
      const [scope, name] = input.slice(marker + 'node_modules/'.length).split('/', 2);
      const packageName = scope.startsWith('@') ? `${scope}/${name}` : scope;
      folders.add(path.resolve(root, input.slice(0, marker), 'node_modules', packageName));
    }
  }
  return [...folders].toSorted((a, b) => a.localeCompare(b));
}
