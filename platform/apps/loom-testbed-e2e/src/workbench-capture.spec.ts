import { Page, expect, test } from '@playwright/test';

interface Picture {
  readonly image: string;
  readonly width: number;
  readonly height: number;
  readonly surfacesAbsent: number;
}

declare global {
  // eslint-disable-next-line no-var
  var lwCapture: (() => Promise<Picture>) | undefined;
}

async function openSandbox(page: Page): Promise<void> {
  await page.goto('/sandbox-static');
  await expect(
    page.locator('iframe[src*="/sandbox-static/view.html"]'),
  ).toBeAttached({ timeout: 20_000 });
  await page.waitForFunction(() => Boolean(globalThis.lwCapture), undefined, {
    timeout: 20_000,
  });
  const surface = page.frameLocator('iframe[src*="/sandbox-static/view.html"]');
  await expect(
    surface.getByRole('heading', { name: /static, non-closable tab/i }),
  ).toBeVisible({ timeout: 20_000 });
}

test.describe('A picture of the workbench', () => {
  test('holds the isolated surface rather than a hole where it sits', async ({
    page,
  }) => {
    await openSandbox(page);

    await expect
      .poll(
        async () =>
          (await page.evaluate(() => globalThis.lwCapture!())).surfacesAbsent,
        { timeout: 20_000 },
      )
      .toBe(0);

    const picture = await page.evaluate(() => globalThis.lwCapture!());
    expect(picture.image).toMatch(/^data:image\/png;base64,/);
    expect(picture.width).toBeGreaterThan(0);
    expect(picture.height).toBeGreaterThan(0);
  });

  test('leaves the workbench as it found it', async ({ page }) => {
    await openSandbox(page);

    const before = await page.evaluate(() => ({
      url: location.href,
      active: document.activeElement?.tagName ?? '',
      scroll: [scrollX, scrollY] as const,
      tabs: document.querySelectorAll('[role="tab"]').length,
    }));

    await page.evaluate(() => globalThis.lwCapture!());

    const after = await page.evaluate(() => ({
      url: location.href,
      active: document.activeElement?.tagName ?? '',
      scroll: [scrollX, scrollY] as const,
      tabs: document.querySelectorAll('[role="tab"]').length,
    }));

    expect(after).toEqual(before);
  });

  test('leaves nothing of its own behind in the document', async ({ page }) => {
    await openSandbox(page);

    const before = await page.evaluate(
      () => document.body.childElementCount,
    );
    await page.evaluate(() => globalThis.lwCapture!());
    const after = await page.evaluate(() => document.body.childElementCount);

    expect(after).toBe(before);
  });
});
