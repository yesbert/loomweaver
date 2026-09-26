// A self-signed certificate in platform/.certs/, generated with openssl the first time it is asked
// for and left alone after that, so a certificate the browser was told to trust keeps being used.
// `.certs/` is gitignored.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CERTIFICATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../.certs');

const IP_ADDRESS = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * The certificate `<name>.pem` and its key `<name>-key.pem` for `hosts`, the first of which is the
 * subject. Reports whether they were created by this call.
 */
export function ensureSelfSignedCertificate({ name, hosts, days }) {
  const certFile = join(CERTIFICATE_DIR, `${name}.pem`);
  const keyFile = join(CERTIFICATE_DIR, `${name}-key.pem`);
  if (existsSync(certFile) && existsSync(keyFile)) {
    return { certFile, keyFile, created: false };
  }
  mkdirSync(CERTIFICATE_DIR, { recursive: true });
  const alternativeNames = hosts
    .map((host) => (IP_ADDRESS.test(host) ? `IP:${host}` : `DNS:${host}`))
    .join(',');
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      String(days),
      '-keyout',
      keyFile,
      '-out',
      certFile,
      '-subj',
      `/CN=${hosts[0]}`,
      '-addext',
      `subjectAltName=${alternativeNames}`,
    ],
    { stdio: 'ignore' },
  );
  return { certFile, keyFile, created: true };
}
