import { build } from 'esbuild';
import { chmodSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function bundleBin(scriptUrl, versionVariable) {
  const at = (path) => fileURLToPath(new URL(path, scriptUrl));
  const outfile = at('dist/main.mjs');
  const { version } = JSON.parse(readFileSync(at('package.json'), 'utf8'));
  await build({
    entryPoints: [at('src/main.ts')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    banner: { js: '#!/usr/bin/env node' },
    alias: { '@loomweaver/devkit': at('../devkit/src/index.ts') },
    define: { [`process.env.${versionVariable}`]: JSON.stringify(version) },
  });
  chmodSync(outfile, 0o755);
}
