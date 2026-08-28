// Serves the production build so the service worker can be exercised locally.
//
// The Angular dev server cannot host the service worker truthfully: it applies per-request
// transformations, so the bytes it serves do not match the hashes in the `ngsw.json` it emits.
// The worker verifies every asset against that manifest, so each watch-mode rebuild ends in
// VERSION_INSTALLATION_FAILED and the shell's (correct) "update failed" toast, a false alarm
// indistinguishable from a broken deploy. Serving the built output makes the hashes match, so
// the PWA install, the update flow and the failure chrome all behave like production.
//
// Deliberately a separate port from `npm start`: a service worker's scope is per origin, so a
// registration left behind by a preview would otherwise keep controlling the dev server and
// serve the stale cached build instead of your edits.
//
// Requests without a file extension fall back to index.html (SPA deep links). Requests that
// look like a file 404 honestly — answering them with HTML would corrupt the worker's hash
// check and reproduce the very failure this script avoids.
//
// Plain HTTP on 127.0.0.1 is deliberate. A service worker needs a secure context, and browsers
// count loopback as one without a certificate, while a self-signed certificate is worse than none
// here: the page loads but the worker script fetch fails the certificate check, so the worker never
// registers and the preview silently stops previewing the thing it exists for.
//
// Paths are resolved relative to this file, so the script is cwd-independent.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..');

const root = resolve(app, process.argv[2] ?? 'dist/loomweaver-demo/browser');
const port = Number(process.argv[3] ?? 4300);
const host = '127.0.0.1';

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
};

if (!existsSync(join(root, 'index.html'))) {
  console.error(`preview: no build at ${root}`);
  console.error('preview: run `npm run build` first.');
  process.exit(1);
}

const fileFor = (url) => {
  const pathname = decodeURIComponent(
    new URL(url, 'http://localhost').pathname,
  );
  const candidate = resolve(root, '.' + pathname);
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    return null;
  }
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }
  return extname(pathname) === '' ? join(root, 'index.html') : null;
};

const server = createServer((req, res) => {
  const file = fileFor(req.url ?? '/');
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  res.writeHead(200, {
    'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
    ...(pathname.startsWith('/api/')
      ? { 'access-control-allow-origin': '*' }
      : {}),
  });
  createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`preview: serving ${root}`);
  console.log(
    `preview: http://${host}:${port}/ — service worker active, update flow live`,
  );
});
