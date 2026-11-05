import { Frame, Page, expect, test } from '@playwright/test';
import {
  REST_SANDBOX_FRAME,
  openRestSandbox,
  restSandboxFrame,
  startupNoticeGone,
} from './support/helpers';

const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

type Colour = readonly [number, number, number];

interface Sampled {
  readonly reported: { readonly width: number; readonly height: number };
  readonly drawn: { readonly width: number; readonly height: number };
  readonly workbench: { readonly width: number; readonly height: number };
  readonly surfacesAbsent: number;
  readonly shares: readonly number[];
}

const MARKER: Colour = [255, 0, 255];

const WITHHELD: Colour = [107, 114, 128];

async function takeAndSample(
  page: Page,
  request: unknown,
  colour: Colour = MARKER,
  boxes: readonly Box[] = [],
): Promise<Sampled> {
  return page.evaluate(
    async ({ request, colour, boxes }) => {
      const capture = (globalThis as Record<string, unknown>)['lwCapture'] as (
        request?: unknown,
      ) => Promise<{
        image: string;
        width: number;
        height: number;
        surfacesAbsent: number;
      }>;
      const picture = await capture(request);
      const image = document.createElement('img');
      await new Promise((resolve) => {
        image.addEventListener('load', resolve);
        image.src = picture.image;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);

      const workbench = document.body.getBoundingClientRect();
      const ratio = image.naturalWidth / workbench.width;
      const share = (box: Box): number => {
        const data = context.getImageData(
          Math.round(box.left * ratio),
          Math.round(box.top * ratio),
          Math.max(1, Math.round(box.width * ratio)),
          Math.max(1, Math.round(box.height * ratio)),
        ).data;
        let matching = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (
            Math.abs(data[i] - colour[0]) < 12 &&
            Math.abs(data[i + 1] - colour[1]) < 12 &&
            Math.abs(data[i + 2] - colour[2]) < 12
          ) {
            matching += 1;
          }
        }
        return matching / (data.length / 4);
      };
      return {
        reported: { width: picture.width, height: picture.height },
        drawn: { width: image.naturalWidth, height: image.naturalHeight },
        workbench: { width: workbench.width, height: workbench.height },
        surfacesAbsent: picture.surfacesAbsent,
        shares: boxes.map((box) => share(box)),
      };
    },
    { request, colour, boxes },
  );
}

async function surfaceBox(page: Page): Promise<Box> {
  const box = await page.locator(REST_SANDBOX_FRAME).boundingBox();
  if (!box) {
    throw new Error('the sandboxed surface has no place on screen');
  }
  return { left: box.x, top: box.y, width: box.width, height: box.height };
}

async function withheldBoxWithin(frame: Frame): Promise<Box> {
  return frame.evaluate(() => {
    document.body.style.boxSizing = 'border-box';
    document.body.style.minHeight = '100vh';
    const area = document.querySelector('#withheld-demo')!;
    const rect = area.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });
}

async function fillSurfaceWithMarker(frame: Frame): Promise<void> {
  await frame.evaluate(() => {
    for (const withheld of document.querySelectorAll('[data-lw-withhold]')) {
      withheld.removeAttribute('data-lw-withhold');
    }
    const marker = document.createElement('div');
    marker.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgb(255,0,255)';
    document.body.append(marker);
  });
}

function inset(box: Box, by: number): Box {
  return {
    left: box.left + by,
    top: box.top + by,
    width: box.width - 2 * by,
    height: box.height - 2 * by,
  };
}

test.describe('The testbed can take a picture by hand', () => {
  test('the palette offers the command and the dialog shows what it drew', async ({
    page,
  }) => {
    await openRestSandbox(page);

    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${mod}+KeyK`);
    await expect(palette).toBeVisible();

    await palette.fill('Picture of the workbench');
    await page
      .getByRole('option', { name: 'Picture of the workbench' })
      .click();

    const drawing = page.getByTestId('capture-dialog-image');
    await expect(drawing).toBeVisible({ timeout: 20_000 });
    await expect(drawing).toHaveAttribute('src', /^data:image\/png;base64,/);
  });

  test('the shortcut takes one too', async ({ page }) => {
    await openRestSandbox(page);

    await page.keyboard.press(`${mod}+Alt+KeyP`);

    await expect(page.getByTestId('capture-dialog-image')).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe('A picture taken on a dense screen', () => {
  test.use({ deviceScaleFactor: 2 });

  test('has the size that was asked for', async ({ page }) => {
    await restSandboxFrame(page);

    const screen = await takeAndSample(page, undefined);
    const plain = await takeAndSample(page, { size: 'plain' });
    const narrow = await takeAndSample(page, { size: { withinWidth: 800 } });

    expect(screen.drawn).toEqual({
      width: screen.workbench.width * 2,
      height: screen.workbench.height * 2,
    });
    expect(screen.reported).toEqual(screen.drawn);
    expect(plain.drawn).toEqual(plain.workbench);
    expect(plain.reported).toEqual(plain.drawn);
    expect(narrow.drawn.width).toBe(800);
    expect(narrow.reported).toEqual(narrow.drawn);
  });

  test('draws an isolated surface where it sits', async ({ page }) => {
    const frame = await restSandboxFrame(page);
    const surface = await surfaceBox(page);
    expect(surface.top).toBeGreaterThan(20);
    await startupNoticeGone(page);
    await fillSurfaceWithMarker(frame);
    const above = { ...surface, top: surface.top - 16, height: 12 };

    for (const request of [undefined, { size: 'plain' }]) {
      const picture = await takeAndSample(page, request, MARKER, [
        inset(surface, 6),
        above,
      ]);

      expect(picture.surfacesAbsent).toBe(0);
      expect(picture.shares[0]).toBeGreaterThan(0.98);
      expect(picture.shares[1]).toBeLessThan(0.02);
    }
  });

  test('shows a notice that lies over an isolated surface', async ({ page }) => {
    const frame = await restSandboxFrame(page);
    const surface = await surfaceBox(page);
    const notice = await page
      .getByRole('status')
      .filter({ hasText: 'Sandbox plugin activated' })
      .boundingBox();
    if (!notice) {
      throw new Error('the startup notice is not on screen');
    }
    const over = {
      left: notice.x,
      top: notice.y,
      width: notice.width,
      height: notice.height,
    };
    expect(over.top).toBeGreaterThan(surface.top);
    expect(over.left).toBeGreaterThan(surface.left);
    await fillSurfaceWithMarker(frame);

    const picture = await takeAndSample(page, undefined, MARKER, [
      inset(over, 6),
      inset(surface, 6),
    ]);

    expect(picture.shares[0]).toBeLessThan(0.02);
    expect(picture.shares[1]).toBeGreaterThan(0.8);
  });

  test('covers what a surface withholds where it sits', async ({ page }) => {
    const frame = await restSandboxFrame(page);
    const surface = await surfaceBox(page);
    const withheld = await withheldBoxWithin(frame);
    const onScreen = inset(
      {
        ...withheld,
        left: surface.left + withheld.left,
        top: surface.top + withheld.top,
      },
      4,
    );

    const picture = await takeAndSample(page, undefined, WITHHELD, [onScreen]);

    expect(picture.shares[0]).toBeGreaterThan(0.6);
  });
});
