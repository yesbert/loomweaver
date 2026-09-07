import { expect, test } from '@playwright/test';

async function chooseLook(page: import('@playwright/test').Page, id: string) {
  await page.goto('/');
  await page.evaluate((value) => localStorage.setItem('demo.look', value), id);
  await page.goto('/');
  await expect(page.locator('lw-shell')).toBeVisible();
}

function searchIcon(page: import('@playwright/test').Page) {
  return page
    .locator('lw-shell-bar button', { hasText: /search/i })
    .locator('lw-icon');
}

test('the default look ships the platform colours and wording', async ({
  page,
}) => {
  await chooseLook(page, 'default');

  await expect(page.locator('lw-shell-brand')).toContainText('LoomWeaver Demo');
  await expect(page.locator('lw-shell-brand')).toContainText(
    'A product built on LoomWeaver',
  );
  const brand = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lw-brand')
      .trim(),
  );
  expect(brand).toBe('#2e96c9');
});

test('the aurora look restyles the app but keeps the LoomWeaver identity', async ({
  page,
}) => {
  await chooseLook(page, 'aurora');

  await expect(page.locator('lw-shell-brand')).toContainText('LoomWeaver Demo');
  await expect(page.locator('lw-shell-brand')).toContainText(
    'Bookkeeping in a new light',
  );
  await expect(page.locator('lw-shell-rail nav').first()).toHaveAttribute(
    'aria-label',
    'Left activity bar',
  );

  const look = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      brand: root.getPropertyValue('--lw-brand').trim(),
      surface: root.getPropertyValue('--lw-surface').trim(),
      font: getComputedStyle(document.body).fontFamily,
      logo: document.querySelector('lw-shell-brand img')?.getAttribute('src'),
    };
  });
  expect(look.brand).toBe('#c59a2f');
  expect(look.surface).toBe('#f7f3ea');
  expect(look.font).toContain('Avenir Next');
  expect(look.logo).toBe('logo.svg');
});

test('the aurora look draws different icon glyphs', async ({ page }) => {
  await chooseLook(page, 'default');
  await expect
    .poll(() => searchIcon(page).innerHTML())
    .toContain('<svg');
  const shipped = await searchIcon(page).innerHTML();

  await chooseLook(page, 'aurora');
  await expect
    .poll(() => searchIcon(page).innerHTML())
    .toContain('<svg');
  expect(await searchIcon(page).innerHTML()).not.toBe(shipped);
});

async function chromeHeight(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const bar = document.querySelector('lw-shell-bar header');
    const strip = document.querySelector('lw-pane-tab-strip');
    const h = (el: Element | null) =>
      el ? el.getBoundingClientRect().height : 0;
    return Math.round(h(bar) + h(strip));
  });
}

test('the breeze look changes the geometry, not just the palette', async ({
  page,
}) => {
  await chooseLook(page, 'default');
  const shippedChrome = await chromeHeight(page);
  const shippedRail = await page.evaluate(() =>
    Math.round(
      document.querySelector('lw-shell-rail nav')!.getBoundingClientRect()
        .width,
    ),
  );

  await chooseLook(page, 'breeze');

  await expect.poll(() => chromeHeight(page)).toBeGreaterThan(shippedChrome);
  const look = await page.evaluate(() => {
    const btn = document.querySelector('.lw-btn, .lw-select-trigger')!;
    return {
      rail: Math.round(
        document.querySelector('lw-shell-rail nav')!.getBoundingClientRect()
          .width,
      ),
      pill: getComputedStyle(btn).borderRadius,
      brand: getComputedStyle(document.documentElement)
        .getPropertyValue('--lw-brand')
        .trim(),
    };
  });
  expect(look.rail).toBeGreaterThan(shippedRail);
  expect(parseFloat(look.pill)).toBeGreaterThan(100);
  expect(look.brand).toBe('#0d9488');
});

test('switching the look is a reload, and it sticks', async ({ page }) => {
  await chooseLook(page, 'default');

  await page.locator('[data-testid="look-switch"]').click();
  await page.getByRole('option', { name: 'Aurora' }).click();

  await expect(page.locator('lw-shell-brand')).toContainText(
    'Bookkeeping in a new light',
  );
  await page.reload();
  await expect(page.locator('lw-shell-brand')).toContainText(
    'Bookkeeping in a new light',
  );
  await expect(page.locator('lw-shell-brand')).toContainText('LoomWeaver Demo');
});

/* A look may raise the header line, but it has to raise all of it: the top bar and the sidebar heads
   beside it share one bottom edge, whether the heads are wide or the narrow window's hamburger
   boxes. Breeze once raised the bar alone, and the line stepped at both of its edges. */
for (const look of ['default', 'aurora', 'breeze']) {
  for (const width of [1280, 600]) {
    test(`the ${look} look keeps one header line at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await chooseLook(page, look);

      const edges = await page.evaluate(() => {
        const bottom = (el: Element) => Math.round(el.getBoundingClientRect().bottom);
        const bar = document.querySelector('lw-shell-bar header');
        const heads = [...document.querySelectorAll('lw-shell-sidebar-header > *')];
        return { bar: bar ? bottom(bar) : null, heads: heads.map(bottom) };
      });

      expect(edges.bar).not.toBeNull();
      expect(edges.heads.length).toBeGreaterThan(0);
      for (const head of edges.heads) {
        expect(head).toBe(edges.bar);
      }
    });
  }
}
