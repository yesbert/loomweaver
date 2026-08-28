#!/usr/bin/env node
// Runs the published quick start against a fresh Angular application and asserts on what it serves.
//
// This exists because every defect it looks for passed a green build. A scaffold that emits sources
// and leaves the workspace unwired produces an application that compiles, exits zero and renders
// nothing recognisable, so only the artefact can tell you.
//
// Install failures and assertion failures are reported apart on purpose: a registry hiccup at three
// in the morning must not read as a regression, or the report gets ignored within a month.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
  for (const name of ['shell', 'plugin-sdk']) {
    const dist = join(platformRoot, 'dist/libs/core', name);
    if (!existsSync(dist)) {
      throw new SetupError(
        `${dist} does not exist — run "nx run-many -t package" and "nx run shell:styles" first.`,
      );
    }
    const output = run('npm', ['pack', dist], into, { setup: true });
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
  rmSync(join(app, 'src/app/app.spec.ts'), { force: true });
  run('npx', ['ng', 'build'], app);
  return join(app, 'dist/my-studio/browser');
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
}

let dir;
try {
  dir = mkdtempSync(join(tmpdir(), 'loom-quick-start-'));
  const browser = quickStart(dir);
  checkServedOutput(browser);
  checkComposition(browser);
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
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('check-quick-start: the published quick start serves a styled, translated workbench');
