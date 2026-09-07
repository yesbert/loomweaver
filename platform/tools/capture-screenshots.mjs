#!/usr/bin/env node
// Photographs the dialogs, menus and prompts a product gets from the shell, using the demo as the
// backdrop, and writes the stills the docs and the landing page embed.
//
// It exists for the reason record-tour.mjs exists: a picture made by hand cannot be made again when
// the chrome changes. Every motif here is a name and the steps that put the demo into the state to
// photograph, so the whole set is one command after a chrome change.
//
// The state is made deterministic here and not in the demo: the welcome dialog is marked as seen,
// motion is reduced so nothing is caught mid-transition, and the clock is fixed so the store's
// relative times do not move between runs.
//
// Usage: node platform/tools/capture-screenshots.mjs [--url http://localhost:4210] [--only <motif>] [--scale 1.5]
// Needs the demo served at that URL (`npm run start -- --port 4210` in demo/). Nothing in CI runs it.

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const mediaDir = join(repoRoot, 'assets/media');

const SIZE = { width: 1280, height: 800 };
const THEMES = ['light', 'dark'];
const FIXED_TIME = new Date('2026-09-07T10:00:00Z');
const WELCOMED_KEY = 'lw.plugin-state:about:welcomed';
const SETTLE_MS = 300;

function arg(name, fallback) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  if (inline) {
    return inline.slice(name.length + 3);
  }
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return fallback;
  }
  const next = process.argv[index + 1];
  return next === undefined || next.startsWith('--') ? fallback : next;
}

const baseUrl = arg('url', 'http://localhost:4210');
const only = arg('only', '');
const scale = Number(arg('scale', '1.5'));

function rail(page) {
  return page.getByRole('navigation', { name: 'Left activity bar' });
}

function dialog(page) {
  return page.getByRole('dialog').first();
}

async function settle(page) {
  await page.waitForTimeout(SETTLE_MS);
}

async function openModule(page, name) {
  await rail(page).getByRole('button', { name, exact: true }).click();
  await settle(page);
}

async function openView(page, path) {
  await page.locator(`[data-nav-view="${path}"]`).click();
  await settle(page);
}

async function openStoreOnPayments(page) {
  await page.locator('[data-rail-item="demo.pluginStore"]').click();
  const store = dialog(page);
  await store.getByTestId('store-card-payments').click();
  await store.getByRole('heading', { name: 'Payment matching' }).first().waitFor();
  await settle(page);
  return store;
}

async function openSalesWithQuotes(page) {
  await openModule(page, 'Sales');
  await openView(page, 'sales/quotes');
  await page.locator('li[data-quote="Q-0007"] button').click();
  await settle(page);
}

const MOTIFS = {
  'plugin-store': async (page) => {
    await openStoreOnPayments(page);
  },

  'plugin-consent': async (page) => {
    const store = await openStoreOnPayments(page);
    await store.getByRole('button', { name: 'Install', exact: true }).click();
    await page.getByRole('dialog', { name: /^Install .*\?$/ }).waitFor();
    await settle(page);
  },

  settings: async (page) => {
    await page.locator('[data-rail-item="demo.settings"]').click();
    const settings = dialog(page);
    await settings.locator('nav').getByText('Permissions', { exact: true }).click();
    await settle(page);
  },

  'workspace-dialog': async (page) => {
    await openSalesWithQuotes(page);
    await page.locator('[data-rail-item="demo.workspaces"]').click();
    const workspaces = dialog(page);
    await workspaces.getByTestId('workspace-tab-mine').click();
    await workspaces.getByPlaceholder('Workspace name').fill('Month end');
    await workspaces.getByTestId('workspace-save').click();
    await settle(page);
  },

  'customize-rail': async (page) => {
    const bar = rail(page);
    const box = await bar.boundingBox();
    await bar.click({ button: 'right', position: { x: box.width / 2, y: box.height / 2 } });
    await page.getByRole('menuitem', { name: 'Customize activity bar' }).click();
    await page.getByTestId('curation-list').waitFor();
    await settle(page);
  },

  'tab-menu': async (page) => {
    await openSalesWithQuotes(page);
    await page.locator('[data-tab-path="sales/quotes"]').click({ button: 'right' });
    await page.getByRole('menu').waitFor();
    await settle(page);
  },

  'rail-menu': async (page) => {
    await rail(page).getByRole('button', { name: 'Finance', exact: true }).click({ button: 'right' });
    await page.getByRole('menu').waitFor();
    await settle(page);
  },

  'quick-open': async (page) => {
    await openSalesWithQuotes(page);
    await openView(page, 'sales/contacts');
    await page.keyboard.press('ControlOrMeta+KeyP');
    await page.getByPlaceholder('Go to open tab…').waitFor();
    await settle(page);
  },

  'split-panes': async (page) => {
    await openModule(page, 'Sales');
    await openView(page, 'sales/contacts');
    await page
      .locator('lw-content-area lw-pane-toolbar button[aria-label="Split right"]')
      .first()
      .click();
    await settle(page);
    await page.locator('[data-tab-path="sales/customers"]').first().click();
    await settle(page);
  },
};

function requireMotif() {
  if (only === '' || Object.hasOwn(MOTIFS, only)) {
    return;
  }
  console.error(`capture-screenshots: --only takes one of ${Object.keys(MOTIFS).join(', ')}, not "${only}".`);
  process.exit(1);
}

async function capture(browser, theme, motif, steps) {
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: scale,
    colorScheme: theme,
    reducedMotion: 'reduce',
    storageState: {
      cookies: [],
      origins: [{ origin: baseUrl, localStorage: [{ name: WELCOMED_KEY, value: 'true' }] }],
    },
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await steps(page);
  const file = join(mediaDir, `${motif}-${theme}.png`);
  await page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
  await context.close();
  return file;
}

async function main() {
  requireMotif();
  mkdirSync(mediaDir, { recursive: true });
  const motifs = only === '' ? Object.keys(MOTIFS) : [only];
  const browser = await chromium.launch();
  try {
    for (const motif of motifs) {
      for (const theme of THEMES) {
        const file = await capture(browser, theme, motif, MOTIFS[motif]);
        const kb = Math.round(statSync(file).size / 1024);
        process.stdout.write(`${motif}-${theme}.png  ${kb} kB\n`);
      }
    }
  } finally {
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
