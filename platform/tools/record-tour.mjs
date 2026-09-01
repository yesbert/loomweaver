#!/usr/bin/env node
// Records the tour that opens the README and the landing page, and encodes the file set the
// website's sync demands.
//
// It exists because the first tour did not have it. The media in assets/media was produced in one
// sitting and committed; whatever drove the browser was never checked in and is not in any branch,
// stash or sibling checkout. So the video could not be re-recorded when the workbench changed, and
// a dashboard that overflowed a split pane stayed on the front page.
//
// It drives Playwright's library rather than its test runner. A tour is a timed animation with
// nothing to assert, and the runner's parallelism, retries and per-test timeouts all work against
// holding a beat for a fixed number of milliseconds.
//
// The cursor and the captions are elements this script puts into the page before each beat. That is
// not decoration: a recorded browser draws no pointer of its own, and a GIF carries no subtitle
// track, so anything added afterwards in an editor would have to be added again by hand every time.
// Drawing them in the page is what makes the run reproducible.
//
// Usage: node platform/tools/record-tour.mjs [--url http://localhost:4200] [--only light|dark]
// Needs the testbed served at that URL, and ffmpeg on PATH. Nothing in CI runs it.

import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const mediaDir = join(repoRoot, 'assets/media');

const SIZE = { width: 1280, height: 800 };
const FPS = 25;
const POSTER_AT = '00:00:13';
const CURSOR_TRAVEL_MS = 420;
const SETTLE_MS = 260;

function arg(name, fallback) {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (hit) {
    return hit.slice(name.length + 3);
  }
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const baseUrl = arg('url', 'http://localhost:4200');
const only = arg('only', '');

function ffmpeg(args) {
  const done = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], {
    stdio: 'inherit',
  });
  if (done.error || done.status !== 0) {
    throw new Error(`ffmpeg failed: ffmpeg ${args.join(' ')}`);
  }
}

function requireFfmpeg() {
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (probe.error) {
    console.error(
      'record-tour needs ffmpeg on PATH to produce the mp4, the gif and the poster.\n' +
        '  macOS:  brew install ffmpeg\n' +
        '  Debian: sudo apt install ffmpeg\n' +
        'The webm alone would not be enough: the website sync fails on a missing file.',
    );
    process.exit(1);
  }
}

const OVERLAY = `
  #lw-tour-cursor {
    position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none;
    width: 22px; height: 22px; margin: -3px 0 0 -3px;
    transition: transform ${CURSOR_TRAVEL_MS}ms cubic-bezier(.32,.72,.28,1);
    filter: drop-shadow(0 1px 2px rgba(0,0,0,.45));
  }
  #lw-tour-cursor svg { width: 100%; height: 100%; display: block; }
  #lw-tour-cursor.is-pressing { transform-origin: 0 0; }
  #lw-tour-ring {
    position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none;
    width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 9999px;
    border: 2px solid #2e96c9; opacity: 0; transform: scale(.4);
  }
  #lw-tour-ring.is-firing { animation: lw-tour-ping 420ms ease-out; }
  @keyframes lw-tour-ping {
    0% { opacity: .9; transform: scale(.4); }
    100% { opacity: 0; transform: scale(1.35); }
  }
  #lw-tour-caption {
    position: fixed; left: 50%; bottom: 34px; transform: translateX(-50%);
    z-index: 2147483647; pointer-events: none;
    max-width: 74%; padding: 10px 18px; border-radius: 10px;
    background: rgba(16, 20, 26, .86); color: #f4f7fa;
    font: 500 17px/1.35 ui-sans-serif, system-ui, sans-serif; text-align: center;
    opacity: 0; transition: opacity 220ms ease;
  }
  #lw-tour-caption.is-shown { opacity: 1; }
`;

const CURSOR_SVG =
  '<svg viewBox="0 0 22 22" aria-hidden="true">' +
  '<path d="M3 2 L3 17 L7.2 13.2 L9.9 19.4 L12.7 18.2 L10.1 12.2 L15.6 12.2 Z" ' +
  'fill="#ffffff" stroke="#101014" stroke-width="1.4" stroke-linejoin="round"/></svg>';

async function installOverlay(page) {
  await page.addStyleTag({ content: OVERLAY });
  await page.evaluate(
    ([svg, start]) => {
      const make = (id) => {
        const node = document.createElement('div');
        node.id = id;
        document.body.appendChild(node);
        return node;
      };
      const cursor = make('lw-tour-cursor');
      cursor.innerHTML = svg;
      const ring = make('lw-tour-ring');
      const caption = make('lw-tour-caption');
      const place = (x, y) => {
        cursor.style.transform = `translate(${x}px, ${y}px)`;
        ring.style.transform = `translate(${x}px, ${y}px)`;
      };
      place(start.x, start.y);
      const api = {
        move: place,
        press: () => {
          ring.classList.remove('is-firing');
          void ring.offsetWidth;
          ring.classList.add('is-firing');
        },
        say: (text) => {
          caption.textContent = text;
          caption.classList.toggle('is-shown', text !== '');
        },
      };
      Reflect.set(globalThis, '__lwTour', api);
    },
    [CURSOR_SVG, { x: SIZE.width / 2, y: SIZE.height - 120 }],
  );
}

function tour(page) {
  const call = (method, payload) =>
    page.evaluate(
      ([name, value]) => Reflect.get(globalThis, '__lwTour')[name](value),
      [method, payload],
    );

  const pause = (ms) => page.waitForTimeout(ms);

  const moveTo = async (locator) => {
    const box = await locator.boundingBox();
    if (box === null) {
      throw new Error('record-tour: the beat points at something that is not on screen');
    }
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    await page.evaluate(
      ([px, py]) => Reflect.get(globalThis, '__lwTour').move(px, py),
      [x, y],
    );
    await page.mouse.move(x, y);
    await pause(CURSOR_TRAVEL_MS);
  };

  return {
    pause,
    say: async (text, hold) => {
      await call('say', text);
      await pause(hold);
    },
    hush: () => call('say', ''),
    moveTo,
    click: async (locator) => {
      await moveTo(locator);
      await call('press');
      await locator.click();
      await pause(SETTLE_MS);
    },
    press: async (keys) => {
      await page.keyboard.press(keys);
      await pause(SETTLE_MS);
    },
    type: async (text) => {
      await page.keyboard.type(text, { delay: 70 });
      await pause(SETTLE_MS);
    },
  };
}

async function beats(page) {
  const act = tour(page);
  const rail = page.getByRole('navigation', { name: 'Toolbar', exact: true });

  await act.say('One workbench. Everything in it is a plugin.', 1900);

  await act.say('The command palette reaches every plugin at once.', 800);
  await act.click(page.getByTestId('command-palette-entry'));
  await act.type('Dashboard');
  await act.pause(700);
  await act.click(
    page.getByRole('option', { name: 'Dashboard', exact: true }).first(),
  );
  await act.pause(900);
  await act.hush();

  await act.say('Split a pane, and the window stays exactly as wide as it was.', 1100);
  await act.click(
    page.locator('lw-content-area lw-pane-toolbar button[aria-label="Split right"]'),
  );
  await act.pause(700);
  await act.say('The surface lays itself out for the pane, not for the window.', 600);
  const divider = page.getByRole('separator', { name: 'Resize split' });
  await act.moveTo(divider);
  await divider.focus();
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('Shift+ArrowLeft');
    await act.pause(420);
  }
  await act.pause(1400);
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('Shift+ArrowRight');
    await act.pause(320);
  }
  await act.hush();

  await act.say('A plugin may be a sandboxed frame, in any framework or none.', 900);
  const sandbox = rail.getByRole('button', { name: 'Sandbox (iframe)', exact: true });
  if ((await sandbox.count()) > 0) {
    await act.click(sandbox);
    await act.pause(1600);
  }
  await act.hush();

  await act.say('And a plugin may re-skin the whole application.', 800);
  const reskin = rail.getByRole('button', { name: 'Toggle the plugin theme' });
  await act.click(reskin);
  await act.pause(1900);
  await act.click(reskin);
  await act.pause(600);

  await act.say('LoomWeaver. The workbench your product does not have to build.', 2200);
  await act.hush();
  await act.pause(400);
}

async function record(theme, workDir) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 1,
    colorScheme: theme,
    reducedMotion: 'no-preference',
    recordVideo: { dir: workDir, size: SIZE },
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await installOverlay(page);

  await beats(page);

  const video = page.video();
  await context.close();
  await browser.close();
  if (video === null) {
    throw new Error('record-tour: playwright produced no video');
  }
  return video.path();
}

function encode(rawWebm, theme) {
  const stem = join(mediaDir, `tour-${theme}`);
  ffmpeg([
    '-y', '-i', rawWebm,
    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1',
    '-r', String(FPS), '-an', `${stem}.webm`,
  ]);
  ffmpeg([
    '-y', '-i', rawWebm,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-r', String(FPS), '-an', `${stem}.mp4`,
  ]);
  ffmpeg([
    '-y', '-ss', POSTER_AT, '-i', rawWebm, '-frames:v', '1', '-q:v', '3',
    `${stem}-poster.jpg`,
  ]);

  const palette = join(dirname(rawWebm), `palette-${theme}.png`);
  const gifChain = 'fps=8,scale=700:-1:flags=lanczos';
  ffmpeg(['-y', '-i', rawWebm, '-vf', `${gifChain},palettegen=stats_mode=diff`, palette]);
  ffmpeg([
    '-y', '-i', rawWebm, '-i', palette,
    '-lavfi', `${gifChain}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
    `${stem}.gif`,
  ]);
}

async function main() {
  requireFfmpeg();
  mkdirSync(mediaDir, { recursive: true });
  const workDir = mkdtempSync(join(tmpdir(), 'lw-tour-'));
  const themes = only === '' ? ['light', 'dark'] : [only];
  try {
    for (const theme of themes) {
      process.stdout.write(`recording ${theme}…\n`);
      const raw = await record(theme, workDir);
      process.stdout.write(`encoding ${theme}…\n`);
      encode(raw, theme);
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
  const written = themes.map((theme) => `tour-${theme}`).join(', ');
  process.stdout.write(`wrote ${written} as webm, mp4, gif and poster to ${mediaDir}\n`);
}

await main();
