import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

test.describe('Scroll indicators come from the tokens', () => {
  test('the workbench resolves them to its own token, not the browser default', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 460 });
    await page.goto('/');
    await expect(rail(page).getByTestId('rail-scroll')).toBeVisible();

    const resolved = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const band = document.querySelector<HTMLElement>(
        'nav [data-testid="rail-scroll"]',
      );
      const probe = document.createElement('span');
      probe.style.color = 'var(--lw-scroll-thumb)';
      document.body.append(probe);
      const thumb = getComputedStyle(probe).color;
      probe.remove();
      return {
        colour: root.scrollbarColor,
        bandWidth: band ? getComputedStyle(band).scrollbarWidth : null,
        bandColour: band ? getComputedStyle(band).scrollbarColor : null,
        thumb,
      };
    });

    expect(resolved.colour).not.toBe('auto');
    expect(resolved.colour).toContain(resolved.thumb);
    expect(resolved.bandWidth).toBe('thin');
    expect(resolved.bandColour).toBe(resolved.colour);
  });

  test('redefining the token changes what the workbench resolves', async ({
    page,
  }) => {
    await page.goto('/');

    const changed = await page.evaluate(() => {
      document.documentElement.style.setProperty(
        '--lw-scroll-thumb',
        'rgb(255, 0, 0)',
      );
      return getComputedStyle(document.documentElement).scrollbarColor;
    });

    expect(changed).toContain('rgb(255, 0, 0)');
  });

  test('the dark theme carries its own thumb', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    const dark = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--lw-scroll-thumb')
        .trim(),
    );

    expect(dark).toBe('rgb(226 232 240 / 0.28)');
  });

  test('a scrolling rail reserves no width it did not reserve before', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 460 });
    await page.goto('/');

    const band = rail(page).getByTestId('rail-scroll');
    const reserved = await band.evaluate((element) => ({
      overflowing: element.scrollHeight > element.clientHeight,
      gutter: element.offsetWidth - element.clientWidth,
    }));

    expect(reserved.overflowing).toBe(true);
    expect(reserved.gutter).toBe(0);
  });
});
