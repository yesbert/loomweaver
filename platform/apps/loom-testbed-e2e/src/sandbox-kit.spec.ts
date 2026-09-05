import { expect, test } from '@playwright/test';

test.describe('Sandbox UI kit — /frame-kit/ assets inside the iframe', () => {
  test('the distribution serves the kit assets under /frame-kit/', async ({
    request,
  }) => {
    for (const asset of [
      'lw-elements.global.js',
      'lw-frame.css',
      'penpal.global.js',
    ]) {
      const response = await request.get(`/frame-kit/${asset}`);
      expect(response.ok(), asset).toBe(true);
    }
  });

  test('<lw-icon> resolves built-in AND plugin-own icons inside the sandbox', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');

    await expect(
      surface.getByTestId('frame-kit-icon').locator('svg'),
    ).toBeAttached();
    await expect(
      surface.getByTestId('frame-kit-own-icon').locator('svg'),
    ).toBeAttached();
  });

  test('<lw-nav-tree> draws, marks and folds inside the sandbox as it does in the chrome', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');
    const tree = surface.getByTestId('frame-kit-nav');

    await expect(tree).toHaveAttribute('role', 'navigation');
    await expect(
      tree.locator('lw-nav-item[aria-current="page"]'),
    ).toHaveAttribute('path', 'dashboard/trends');
    await expect(tree.locator('lw-nav-item')).toHaveCount(3);
    await expect(
      tree.locator('lw-nav-item[path="dashboard/trends"]'),
    ).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await tree.locator('.lw-nav-group-heading').click();

    await expect(tree.locator('lw-nav-group')).toHaveAttribute(
      'data-open',
      'false',
    );
    await expect(
      tree.locator('lw-nav-item[path="dashboard/trends"]'),
    ).toBeHidden();
  });

  test("the product's replacement icons reach the surface, so one screen has one icon set", async ({
    page,
  }) => {
    const marker = 'M12 3.5 21 20H3l9-16.5Z';
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');

    await expect
      .poll(async () =>
        surface
          .getByTestId('frame-kit-icon')
          .locator('svg path')
          .getAttribute('d'),
      )
      .toBe(marker);
    const inChrome = await page.evaluate(() => {
      const icon = document.createElement('lw-icon');
      icon.setAttribute('name', 'plugin');
      document.body.append(icon);
      const drawn = icon.querySelector('path')?.getAttribute('d') ?? '';
      icon.remove();
      return drawn;
    });
    expect(inChrome).toBe(marker);
  });

  test('<lw-button> paints via the compiled .lw-btn contract and handles its click in-process', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');

    const button = surface.getByTestId('frame-kit-button');
    await expect(button).toHaveClass(/lw-btn--primary/);
    const paint = await button.evaluate((element) => {
      const styles = getComputedStyle(element);
      return { background: styles.backgroundColor, cursor: styles.cursor };
    });
    expect(paint.cursor).toBe('pointer');
    expect(paint.background).not.toBe('rgba(0, 0, 0, 0)');

    await button.click();
    await expect(surface.getByText(/handled in-process/)).toBeVisible();
  });

  test('the badge class contract and the progress ring render from the kit CSS/bundle', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');

    await expect(surface.getByTestId('frame-kit-badge')).toBeVisible();
    await expect(
      surface.getByTestId('frame-kit-ring').locator('svg'),
    ).toBeAttached();
    await expect(surface.getByTestId('frame-kit-ring')).toContainText('72');
  });

  test('the token push is the FULL LW_TOKENS set and matches the host resolved values', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');
    await expect(surface.getByTestId('frame-kit-strip')).toBeVisible();

    const hostValues = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        positive: styles.getPropertyValue('--lw-positive').trim(),
        negative: styles.getPropertyValue('--lw-negative').trim(),
        fontMono: styles.getPropertyValue('--lw-font-mono').trim(),
      };
    });
    expect(hostValues.positive).not.toBe('');

    const surfaceRoot = surface.locator('html');
    await expect
      .poll(() =>
        surfaceRoot.evaluate((root) =>
          root.style.getPropertyValue('--lw-positive').trim(),
        ),
      )
      .toBe(hostValues.positive);
    const surfaceValues = await surfaceRoot.evaluate((root) => ({
      positive: root.style.getPropertyValue('--lw-positive').trim(),
      negative: root.style.getPropertyValue('--lw-negative').trim(),
      fontMono: root.style.getPropertyValue('--lw-font-mono').trim(),
    }));
    expect(surfaceValues).toEqual(hostValues);
  });
});
