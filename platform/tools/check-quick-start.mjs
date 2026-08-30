#!/usr/bin/env node
// Runs the published quick start against a fresh Angular application and asserts on what it serves.
//
// This exists because every defect it looks for passed a green build. A scaffold that emits sources
// and leaves the workspace unwired produces an application that compiles, exits zero and renders
// nothing recognisable, so only the artefact can tell you.
//
// Install failures and assertion failures are reported apart on purpose: a registry hiccup at three
// in the morning must not read as a regression, or the report gets ignored within a month.
//
// The last leg opens the built application in a browser, because everything before it can only see
// that a file was delivered. A surface can sit whole in the bundle and still never appear, so being
// present and being reachable are two claims and only one of them is checked by reading bytes.

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const platformRoot = resolve(fileURLToPath(import.meta.url), '../..');
const ANGULAR = process.env.LOOM_QUICK_START_ANGULAR ?? '@angular/cli@22';

class SetupError extends Error {}
class AssertionError extends Error {}

const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function run(command, args, cwd, { setup = false } = {}) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: '1' },
    });
  } catch (error) {
    const detail = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().slice(-2000);
    const text = `${command} ${args.join(' ')} failed in ${cwd}:\n${detail}`;
    throw setup ? new SetupError(text) : new AssertionError(text);
  }
}

function packPlatform(into) {
  const packages = [];
  for (const [area, name] of [
    ['core', 'shell'],
    ['core', 'plugin-sdk'],
    ['integrations', 'ag-ui'],
  ]) {
    const distribution = join(platformRoot, 'dist/libs', area, name);
    if (!existsSync(distribution)) {
      throw new SetupError(
        `${distribution} does not exist — run "nx run-many -t package" and "nx run shell:styles" first.`,
      );
    }
    const output = run('npm', ['pack', distribution], into, { setup: true });
    packages.push(join(into, output.trim().split('\n').pop()));
  }
  return packages;
}

function quickStart(dir) {
  const packed = packPlatform(dir);
  run('npx', ['-y', ANGULAR, 'new', 'my-studio', '--style=css', '--ssr=false', '--skip-git', '--defaults'], dir, { setup: true });
  const app = join(dir, 'my-studio');
  const angularVersion = JSON.parse(
    readFileSync(join(app, 'node_modules/@angular/core/package.json'), 'utf8'),
  ).version;
  run('npm', ['install', ...packed, '@angular/cdk', '@jsverse/transloco', '@ng-icons/heroicons', `@angular/service-worker@${angularVersion}`], app, { setup: true });
  run('npm', ['install', '-D', 'tailwindcss', '@tailwindcss/postcss', '@tailwindcss/typography'], app, { setup: true });

  const cli = join(platformRoot, 'libs/tooling/cli/dist/main.mjs');
  if (!existsSync(cli)) {
    throw new SetupError(`${cli} does not exist — run "nx run cli:bundle" first.`);
  }
  run('node', [cli, 'distribution', '--name', 'my-studio', '--title', 'My Studio', '--out', '.', '--force'], app);
  run('node', [cli, 'weaver', '--id', 'notes', '--command', '--shortcut', 'mod+shift+n', '--out', 'src/notes'], app);
  // The agent connection is the one generated feature that needs a package the application does not
  // already carry. @ag-ui/core is deliberately NOT installed above: the scaffold has to record it,
  // and the install below is what turns that record into something the build can resolve. If the
  // route ever stops recording it, the build fails here rather than in a consumer's project.
  run('node', [cli, 'weaver', '--id', 'copilot', '--agent', '--out', 'src/copilot'], app);
  run('npm', ['install'], app, { setup: true });
  rmSync(join(app, 'src/app/app.spec.ts'), { force: true });
  run('npx', ['ng', 'build'], app);
  return { browser: join(app, 'dist/my-studio/browser'), app };
}

function checkServedOutput(browser) {
  const styles = readdirSync(browser).filter((file) => file.endsWith('.css'));
  assert(styles.length === 1, `expected exactly one stylesheet, found ${styles.length}`);
  const css = styles.length === 1 ? readFileSync(join(browser, styles[0]), 'utf8') : '';

  for (const directive of ['@plugin', '@source']) {
    assert(
      !css.includes(directive),
      `${directive} survived into the served stylesheet, so the style pipeline never ran and the workbench renders unstyled`,
    );
  }
  for (const utility of ['.flex{', '.grid{', 'sr-only']) {
    assert(
      css.includes(utility),
      `the served stylesheet carries no "${utility}" rule, so the chrome's own utilities were never emitted`,
    );
  }
  assert(
    css.includes('.lw-'),
    'the served stylesheet carries none of the .lw-* class contracts',
  );

  assert(
    existsSync(join(browser, 'i18n/en.json')),
    'the shell\'s translations were not served, so every label in the chrome renders as its raw key',
  );
  assert(
    existsSync(join(browser, 'i18n/notes/en.json')),
    "the weaver's translations were not served",
  );
  assert(
    existsSync(join(browser, 'ngsw-worker.js')),
    'no service worker was emitted, so the registration provideShell() makes would 404',
  );

  const index = readFileSync(join(browser, 'index.html'), 'utf8');
  assert(
    !/onload=/.test(index),
    "index.html loads the stylesheet with an inline onload handler, which its own script-src 'self' blocks — the release build renders unstyled",
  );
}

function checkComposition(browser) {
  const main = readdirSync(browser).find((file) => file.startsWith('main-'));
  const bundle = readFileSync(join(browser, main), 'utf8');
  assert(
    bundle.includes('notes'),
    'the scaffolded weaver never reached the bundle, so its icon is not in the rail',
  );
  assert(
    bundle.includes('copilot.agent'),
    'the generated agent panel never reached the bundle, so nothing is docked to drive the workbench from',
  );
  assert(
    bundle.includes('stand-in'),
    'the generated stand-in never reached the bundle, so the first serve has no events to run the path with',
  );
}

function checkAgentDependencies(app) {
  const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
  assert(
    manifest.dependencies?.['@ag-ui/core'] !== undefined,
    "@ag-ui/core was not recorded in the application's dependencies, so the generated agent connection imports a package nobody installs",
  );
  assert(
    existsSync(join(app, 'node_modules/@ag-ui/core')),
    'what the scaffold recorded did not resolve to an installed package, so recording it bought the consumer nothing',
  );
  assert(
    existsSync(join(app, 'src/copilot/src/lib/agent/copilot-agent-source.ts')),
    'the stand-in was not generated, so there is nothing to replace with a real transport',
  );
}

const CONTENT_TYPES = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

// The built output, over http rather than from disk. A file:// page has no origin, and the shell
// stores per-origin, so serving it is what makes the application behave as it does for a reader.
// Anything the directory does not hold falls back to index.html, the way any host of a single-page
// application must answer.
function serveBuilt(root) {
  const server = createServer((request, response) => {
    const asked = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const wanted = join(root, asked);
    const file =
      wanted.startsWith(root) && existsSync(wanted) && statSync(wanted).isFile()
        ? wanted
        : join(root, 'index.html');
    response.writeHead(200, {
      'content-type':
        CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    });
    response.end(readFileSync(file));
  });
  return new Promise((listening) => {
    server.listen(0, '127.0.0.1', () =>
      listening({
        origin: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((closed) => server.close(closed)),
      }),
    );
  });
}

// The checks above read the delivered files. This one drives them: it opens the panel the generator
// wrote, runs the command it declared callable, and reads the outcome the workbench gave back. Each
// step names what its own failure would mean, because a bare timeout says only that something did
// not appear, and the whole point of this leg is to say which claim broke.
async function checkInTheBrowser(built) {
  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch (error) {
    throw new SetupError(`Playwright is not installed here: ${error.message}`);
  }

  const site = await serveBuilt(built);
  let runner;
  try {
    runner = await chromium.launch();
  } catch (error) {
    await site.close();
    throw new SetupError(
      `Chromium would not start — run "npx playwright install --with-deps chromium": ${error.message}`,
    );
  }

  // The build emits a service worker on purpose and the checks above assert that it does. Letting it
  // claim this page would answer the second run from a cache, so what is under test would be
  // whatever the first run happened to store.
  const context = await runner.newContext({
    serviceWorkers: 'block',
    viewport: { width: 1600, height: 900 },
  });
  const page = await context.newPage();
  try {
    await drivePanel(page, site.origin);
  } catch (error) {
    failures.push(
      `${error.step ?? 'the generated agent connection'} — ${error.message.split('\n')[0]}`,
    );
  } finally {
    await runner.close();
    await site.close();
  }
}

// Wraps a step so its failure reads as the claim that broke rather than as a selector that timed out.
async function step(what, act) {
  try {
    return await act();
  } catch (error) {
    error.step = what;
    throw error;
  }
}

async function drivePanel(page, origin) {
  const { expect } = await import('@playwright/test');

  await step('the generated application would not load at all', async () => {
    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  });

  const panel = page.locator('lw-copilot-agent-panel');
  await step(
    'the generated agent panel is in the bundle but never appears on screen, so a reader serving this finds nothing to drive the workbench from',
    async () => {
      await expect(panel).toBeVisible({ timeout: 30_000 });
      await expect(panel).toContainText('This is a stand-in, not an assistant');
    },
  );

  const offered = panel.getByRole('button');
  await step(
    'the panel offers no command, so the list the workbench hands an agent never arrived',
    async () => {
      await expect(offered).toHaveCount(1);
    },
  );

  await step(
    'a consequential call ran without asking the person at the keyboard, so the decision hook the generator wired is not in the path',
    async () => {
      await offered.click();
      await expect(page.getByRole('dialog')).toContainText('Run this command?');
    },
  );

  await step(
    'declining the confirmation did not stop the call, so declining costs nothing and the hook is decoration',
    async () => {
      await page.getByRole('button', { name: 'Not now' }).click();
      await expect(panel).toContainText('The command did not run', {
        timeout: 30_000,
      });
    },
  );

  await step(
    'confirming the call produced no outcome, so the generated path reaches the workbench but never hears back',
    async () => {
      await expect(offered).toBeEnabled({ timeout: 30_000 });
      await offered.click();
      await page.getByRole('button', { name: 'Run it' }).click();
      await expect(panel).toContainText('The command ran.', {
        timeout: 30_000,
      });
    },
  );
}

let dir;
try {
  dir = mkdtempSync(join(tmpdir(), 'loom-quick-start-'));
  const generated = quickStart(dir);
  checkServedOutput(generated.browser);
  checkComposition(generated.browser);
  checkAgentDependencies(generated.app);
  await checkInTheBrowser(generated.browser);
} catch (error) {
  if (error instanceof SetupError) {
    console.error(`check-quick-start SETUP FAILED (not a regression):\n${error.message}`);
    process.exit(2);
  }
  console.error(`check-quick-start FAILED:\n${error.message}`);
  process.exit(1);
} finally {
  if (dir) {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (failures.length > 0) {
  console.error('check-quick-start: the published quick start does not produce a working workbench');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'check-quick-start: the published quick start serves a styled, translated workbench, and the generated agent panel runs a command in it',
);
