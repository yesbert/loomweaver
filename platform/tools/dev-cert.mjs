// Ensures a stable self-signed dev certificate exists for `npm run start:testbed`.
//
// The platform is frontend-only, so this does NOT depend on .NET /
// `dotnet dev-certs`. It generates a localhost certificate with `openssl` into
// .certs/ only when missing, so start:testbed can pin a stable cert the browser can
// trust once (an auto-generated `--ssl` cert changes every run and can't be
// pre-trusted, which is why Safari refused to load the app). `.certs/` is
// gitignored; an existing (already-trusted) cert is left untouched.
//
// Paths are resolved relative to this file, so the script is cwd-independent.

import { existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const certDir = resolve(here, '../.certs');
const certFile = resolve(certDir, 'aspnet-dev.pem');
const keyFile = resolve(certDir, 'aspnet-dev.key');

if (existsSync(certFile) && existsSync(keyFile)) {
  process.exit(0);
}

mkdirSync(certDir, { recursive: true });

try {
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      keyFile,
      '-out',
      certFile,
      '-days',
      '825',
      '-subj',
      '/CN=localhost',
      '-addext',
      'subjectAltName=DNS:localhost,IP:127.0.0.1',
    ],
    { stdio: 'ignore' },
  );
  console.log(
    'dev-cert: generated a self-signed certificate at .certs/ (CN=localhost).',
  );
  console.log(
    'dev-cert: trust it once so the browser accepts https://localhost:4200 —',
  );
  console.log(
    '  macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .certs/aspnet-dev.pem',
  );
} catch {
  console.error(
    'dev-cert: could not generate a certificate — is `openssl` on your PATH?',
  );
  console.error(
    'dev-cert: provide .certs/aspnet-dev.pem + .certs/aspnet-dev.key manually, then re-run.',
  );
  process.exit(1);
}
