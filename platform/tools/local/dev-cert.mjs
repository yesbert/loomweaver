// Ensures a stable self-signed certificate for localhost exists for `npm run start:testbed`.
//
// The dev server could make its own with `--ssl`, but that one changes every run and cannot be
// trusted in advance, which is why Safari refused to load the app. This one is generated once,
// trusted once, and kept. A certificate from mkcert under the same two names is used as it is.

import { relative } from 'node:path';
import { ensureSelfSignedCertificate } from './self-signed-certificate.mjs';

try {
  const { certFile, keyFile, created } = ensureSelfSignedCertificate({
    name: 'localhost',
    hosts: ['localhost', '127.0.0.1'],
    days: 825,
  });
  if (created) {
    const shown = relative(process.cwd(), certFile);
    console.log(`dev-cert: generated a self-signed certificate for localhost at ${shown}.`);
    console.log('dev-cert: trust it once so the browser accepts https://127.0.0.1:4200 —');
    console.log(
      `  macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${shown}`,
    );
    console.log(`dev-cert: its key is ${relative(process.cwd(), keyFile)}.`);
  }
} catch {
  console.error('dev-cert: could not generate a certificate — is `openssl` on your PATH?');
  console.error('dev-cert: provide .certs/localhost.pem and .certs/localhost-key.pem, then re-run.');
  process.exit(1);
}
