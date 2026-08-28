import { build } from 'esbuild';
import { chmodSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const devkit = fileURLToPath(new URL('../devkit/src/index.ts', import.meta.url));
const outfile = fileURLToPath(new URL('./dist/main.mjs', import.meta.url));
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
);

await build({
  entryPoints: [fileURLToPath(new URL('./src/main.ts', import.meta.url))],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  alias: { '@loomweaver/devkit': devkit },
  define: { 'process.env.LOOM_CLI_VERSION': JSON.stringify(pkg.version) },
});

chmodSync(outfile, 0o755);
