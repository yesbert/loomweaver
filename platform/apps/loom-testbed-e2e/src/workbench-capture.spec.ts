import { Page, expect, test } from '@playwright/test';

interface Picture {
  readonly image: string;
  readonly width: number;
  readonly height: number;
  readonly form: 'lossless' | 'jpeg' | 'webp';
  readonly surfacesAbsent: number;
}

interface PictureRequest {
  readonly size?: 'screen' | 'plain' | { readonly withinWidth: number };
  readonly form?:
    | 'lossless'
    | { readonly compressed: 'jpeg' | 'webp'; readonly quality?: number };
}

declare global {
  // eslint-disable-next-line no-var
  var lwCapture:
    | ((request?: PictureRequest) => Promise<Picture>)
    | undefined;
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

  test('is drawn no wider than a width the caller names', async ({ page }) => {
    await openSandbox(page);

    const pictures = await page.evaluate(async () => {
      const screen = await globalThis.lwCapture!();
      const narrow = await globalThis.lwCapture!({
        size: { withinWidth: 400 },
      });
      return {
        screen: { width: screen.width, height: screen.height },
        narrow: { width: narrow.width, height: narrow.height },
      };
    });

    expect(pictures.narrow.width).toBeLessThanOrEqual(400);
    expect(pictures.narrow.width).toBeLessThan(pictures.screen.width);
    expect(pictures.narrow.width / pictures.narrow.height).toBeCloseTo(
      pictures.screen.width / pictures.screen.height,
      1,
    );
  });

  test('holds fewer bytes compressed than it does losslessly', async ({
    page,
  }) => {
    await openSandbox(page);

    const carried = await page.evaluate(async () => {
      const lossless = await globalThis.lwCapture!();
      const compressed = await globalThis.lwCapture!({
        form: { compressed: 'jpeg', quality: 0.6 },
      });
      return {
        lossless: lossless.image.length,
        compressed: compressed.image.length,
        form: compressed.form,
      };
    });

    expect(carried.form).toBe('jpeg');
    expect(carried.compressed).toBeLessThan(carried.lossless);
  });

  test('asks the browser for no permission along the way', async ({ page }) => {
    await openSandbox(page);

    const asked = await page.evaluate(async () => {
      const media = navigator.mediaDevices as unknown as Record<string, unknown>;
      const calls: string[] = [];
      for (const name of ['getDisplayMedia', 'getUserMedia']) {
        media[name] = () => {
          calls.push(name);
          return Promise.reject(new Error('not permitted in this test'));
        };
      }
      const requested: string[] = [];
      const permissions = navigator.permissions as unknown as Record<string, unknown>;
      permissions['query'] = (descriptor: { name: string }) => {
        requested.push(descriptor.name);
        return Promise.reject(new Error('not permitted in this test'));
      };

      await globalThis.lwCapture!();
      return [...calls, ...requested];
    });

    expect(asked).toEqual([]);
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
