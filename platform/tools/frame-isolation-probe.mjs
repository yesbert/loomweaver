// Measures whether a frozen child frame freezes the page that hosts it, across the four
// arrangements a distribution can choose from. Run it in every browser you support: the answer
// differs per engine, and an automation harness cannot answer it — it drives its own builds of
// Firefox and WebKit, and those report a different result from the installed browsers.
//
//   1. sudo sh -c 'printf "127.0.0.1 app.loomweaver.test plain.loomweaver.test keyed.loomweaver.test other.test\n" >> /etc/hosts'
//   2. node tools/frame-isolation-probe.mjs
//   3. accept the self-signed certificate once per origin (the script prints the four URLs)
//   4. open the last URL — it runs all four arrangements by itself and prints a table
//
// HTTPS is not optional: Origin-Agent-Cluster is ignored outside a secure context, and only
// localhost and loopback literals are secure without a certificate — and those cannot be
// same-site siblings, which is the arrangement worth measuring.

import { createServer } from 'node:https';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUSY_MS = 1500;
const PARENT = 'app.loomweaver.test';
const SIBLING_PLAIN = 'plain.loomweaver.test';
const SIBLING_KEYED = 'keyed.loomweaver.test';
const FOREIGN = 'other.test';
const PARENT_PORT = 4443;
const CHILD_PORT = 4444;

const CASES = [
  { label: 'same-origin (control — must freeze)', host: PARENT, port: PARENT_PORT, oac: false },
  { label: 'sibling subdomain, no header', host: SIBLING_PLAIN, port: CHILD_PORT, oac: false },
  { label: 'sibling subdomain + Origin-Agent-Cluster: ?1', host: SIBLING_KEYED, port: CHILD_PORT, oac: true },
  { label: 'cross-site', host: FOREIGN, port: CHILD_PORT, oac: false },
];

const here = dirname(fileURLToPath(import.meta.url));
const certDir = resolve(here, '../.certs');
const certFile = join(certDir, 'frame-isolation.pem');
const keyFile = join(certDir, 'frame-isolation.key');

function ensureCertificate() {
  if (existsSync(certFile) && existsSync(keyFile)) {
    return;
  }
  mkdirSync(certDir, { recursive: true });
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '365',
    '-keyout', keyFile, '-out', certFile,
    '-subj', `/CN=${PARENT}`,
    '-addext', `subjectAltName=DNS:${PARENT},DNS:${SIBLING_PLAIN},DNS:${SIBLING_KEYED},DNS:${FOREIGN}`,
  ], { stdio: 'ignore' });
  console.log(`Generated a self-signed certificate in ${certDir}.`);
}

const childDocument = `<!doctype html><meta charset="utf-8"><body><script>
addEventListener('message', (e) => {
  if (!e.data || e.data.t !== 'go') return;
  const s = performance.now();
  while (performance.now() - s < ${BUSY_MS}) {}
});
parent.postMessage({ t: 'ready', oac: (typeof originAgentCluster === 'undefined' ? 'n/a' : originAgentCluster) }, '*');
</script>`;

const parentDocument = (index) => {
  const c = CASES[index];
  return `<!doctype html><meta charset="utf-8"><title>Frame isolation ${index + 1}/${CASES.length}</title>
<style>
 body{font:15px/1.6 system-ui,-apple-system,sans-serif;margin:2.5rem;max-width:54rem;color:#0f172a}
 h1{font-size:1.35rem;margin:0 0 .5rem}
 table{border-collapse:collapse;width:100%;margin-top:1.25rem}
 th,td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid #e2e8f0;font-size:.92rem}
 .bad{color:#b91c1c;font-weight:600}.good{color:#15803d;font-weight:600}
 iframe{position:absolute;left:-9999px;width:0;height:0;border:0}
 p.note{color:#64748b}
 code{background:#f1f5f9;padding:.1rem .35rem;border-radius:4px;font-size:.85em}
</style>
<body>
<h1>Does a frozen child frame freeze the page hosting it?</h1>
<p class="note">Case ${index + 1} of ${CASES.length}: <strong>${c.label}</strong>. The child burns ${BUSY_MS} ms of CPU; this page measures how long its own timer stops.</p>
<p class="note" id="hint"></p>
<div id="out"></div>
<p><button id="again" type="button">Start over</button></p>
<script>
const CASES = ${JSON.stringify(CASES.map((x) => x.label))};
const CHILD = ${JSON.stringify(`https://${c.host}:${c.port}/child?case=${index}`)};
const INDEX = ${index}, BUSY_MS = ${BUSY_MS};

function load() {
  const raw = JSON.parse(sessionStorage.getItem('probe') || '[]');
  return CASES.map((label, i) => raw[i] || { label, stall: null, oac: null });
}
function save(results) {
  sessionStorage.setItem('probe', JSON.stringify(results));
}
function render(results) {
  const rows = results.map((r, i) => {
    const pending = r.stall === null;
    const verdict = pending
      ? (i === INDEX ? '<em>measuring…</em>' : 'not measured')
      : (r.stall > BUSY_MS * 0.5
          ? '<span class="bad">freezes with it</span>'
          : '<span class="good">keeps running</span>');
    return '<tr><td>' + r.label + '</td><td>' + (pending ? '—' : r.stall + ' ms') +
      '</td><td>' + (r.oac === null ? '—' : r.oac) + '</td><td>' + verdict + '</td></tr>';
  }).join('');
  document.getElementById('out').innerHTML =
    '<table><tr><th>Arrangement</th><th>Host page stalled for</th><th>originAgentCluster</th><th></th></tr>' +
    rows + '</table>';
  if (results.every((r) => r.stall !== null)) {
    document.getElementById('hint').innerHTML =
      'Done — this is the whole result. <code>' + navigator.userAgent + '</code>';
  }
}

document.getElementById('again').onclick = () => {
  sessionStorage.removeItem('probe');
  location.search = '?case=0';
};

const results = load();
render(results);

const ticks = [];
setInterval(() => ticks.push(performance.now()), 10);

const stuck = setTimeout(() => {
  document.getElementById('hint').innerHTML =
    'The child frame never answered. Open <a href="' + CHILD + '">' + CHILD +
    '</a> in a tab, accept the certificate, then come back and reload this page.';
}, 5000);

addEventListener('message', (e) => {
  if (!e.data || e.data.t !== 'ready') return;
  clearTimeout(stuck);
  const oac = String(e.data.oac);
  ticks.length = 0;
  const goAt = performance.now();
  frame.contentWindow.postMessage({ t: 'go' }, '*');
  setTimeout(() => {
    results[INDEX] = { label: CASES[INDEX], stall: Math.round(ticks[0] - goAt), oac };
    save(results);
    if (INDEX + 1 < CASES.length) location.search = '?case=' + (INDEX + 1);
    else render(results);
  }, BUSY_MS + 1200);
});

const frame = document.createElement('iframe');
frame.id = 'f';
frame.src = CHILD;
document.body.appendChild(frame);
</script>`;
};

ensureCertificate();
const options = { cert: readFileSync(certFile), key: readFileSync(keyFile) };

function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const index = Math.min(Math.max(Number(url.searchParams.get('case') ?? 0) || 0, 0), CASES.length - 1);
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };
  if (CASES[index].oac) {
    headers['origin-agent-cluster'] = '?1';
  }
  res.writeHead(200, headers);
  res.end(url.pathname === '/child' ? childDocument : parentDocument(index));
}

createServer(options, handler).listen(PARENT_PORT);
createServer(options, handler).listen(CHILD_PORT);

console.log(`
Accept the certificate once per origin, in this order:

  1. https://${SIBLING_PLAIN}:${CHILD_PORT}/child
  2. https://${SIBLING_KEYED}:${CHILD_PORT}/child
  3. https://${FOREIGN}:${CHILD_PORT}/child
  4. https://${PARENT}:${PARENT_PORT}/

The last one runs all four arrangements by itself. Ctrl-C when done.

Each arrangement uses a host of its own on purpose: whether an origin is origin-keyed is
decided once per browsing context group, so reusing one host would let the header-less case
decide the keying for the case that sets the header.
`);
