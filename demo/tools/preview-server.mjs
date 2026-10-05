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
