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

const PAGE: Colour = [200, 230, 255];

interface ShortSurface {
  readonly marker: Box;
  readonly belowThePage: Box;
}

async function markerInAShortSurface(frame: Frame): Promise<ShortSurface> {
  return frame.evaluate(() => {
    document.body.style.background = 'rgb(200, 230, 255)';
    const marker = document.createElement('div');
    marker.style.cssText =
      'position:absolute;left:100px;top:450px;width:200px;height:100px;background:rgb(255,0,255)';
    document.body.append(marker);
    const page = document.body.getBoundingClientRect();
    if (page.bottom + 60 > innerHeight) {
      throw new Error('the surface is not shorter than its frame');
    }
    const rect = marker.getBoundingClientRect();
    return {
      marker: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      belowThePage: {
        left: 20,
        top: page.bottom + 20,
        width: 300,
        height: innerHeight - page.bottom - 40,
      },
    };
  });
}

async function markerInAScrolledSurface(frame: Frame): Promise<Box> {
  return frame.evaluate(() => {
    const spacer = (): HTMLElement => {
      const element = document.createElement('div');
      element.style.height = '1500px';
      return element;
    };
    const marker = document.createElement('div');
    marker.style.cssText =
      'margin-left:100px;width:200px;height:100px;background:rgb(255,0,255)';
    document.body.append(spacer(), marker, spacer());
    scrollTo({
      top: scrollY + marker.getBoundingClientRect().top - 300,
      behavior: 'instant',
    });
    if (scrollY === 0) {
      throw new Error('the surface did not scroll');
    }
    const rect = marker.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });
}

async function placeOnScreen(page: Page, within: Box): Promise<Box> {
  const surface = await surfaceBox(page);
  return {
    ...within,
    left: surface.left + within.left,
    top: surface.top + within.top,
  };
}

async function markerShares(
  page: Page,
  marker: Box,
): Promise<readonly number[]> {
  const place = await placeOnScreen(page, marker);
  const picture = await takeAndSample(page, { size: 'plain' }, MARKER, [
    inset(place, 4),
    { ...place, top: place.top - 20, height: 12 },
    { ...place, top: place.top + place.height + 8, height: 12 },
  ]);
  return picture.shares;
}

interface WithheldPicture {
  readonly leaked: number;
  readonly covered: number;
  readonly drawings: number;
}

type Withholding = 'moves once asked' | 'moves once drawn' | 'fixed and scrolled';

async function pictureOfWhatIsWithheld(
  frame: Frame,
  situation: Withholding,
): Promise<WithheldPicture> {
  return frame.evaluate(async (situation) => {
    const api = (globalThis as Record<string, unknown>)['LwFrame'] as {
      capture(request?: {
        scale?: number;
        withheldLabel?: string;
      }): Promise<{ image: string; width: number; height: number }>;
    };
    await api.capture({ scale: 1 });

    const secret = 'background:rgb(255,0,255);color:rgb(255,0,255)';
    let area = document.querySelector<HTMLElement>('#withheld-demo')!;
    if (situation === 'fixed and scrolled') {
      area.removeAttribute('data-lw-withhold');
      const spacer = document.createElement('div');
      spacer.style.height = '1500px';
      area = document.createElement('div');
      area.setAttribute('data-lw-withhold', '');
      area.style.cssText = `position:fixed;right:40px;bottom:40px;width:200px;height:80px;${secret}`;
      document.body.append(spacer, area);
      scrollTo({ top: 200, behavior: 'instant' });
    } else {
      area.style.cssText = secret;
    }

    const renderer = (
      (globalThis as Record<string, unknown>)['LwSnapdom'] as {
        snapdom: {
          toCanvas(target: Element, options: unknown): Promise<unknown>;
        };
      }
    ).snapdom;
    const draw = renderer.toCanvas.bind(renderer);
    let drawings = 0;
    const move = (): void => {
      area.style.marginTop = '160px';
    };
    renderer.toCanvas = (target, options) => {
      drawings += 1;
      const drawing = draw(target, options);
      if (situation === 'moves once asked') {
        move();
      }
      return situation === 'moves once drawn'
        ? drawing.then((canvas) => {
            move();
            return canvas;
          })
        : drawing;
    };

    const before = area.getBoundingClientRect();
    const capture = await api.capture({ scale: 1, withheldLabel: 'x' });
    const pictured =
      situation === 'moves once drawn' ? before : area.getBoundingClientRect();
    const image = document.createElement('img');
    await new Promise((resolve) => {
      image.addEventListener('load', resolve);
      image.src = capture.image;
    });
    const canvas = document.createElement('canvas');
    canvas.width = capture.width;
    canvas.height = capture.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const share = (
      colour: readonly number[],
      box: { left: number; top: number; width: number; height: number },
    ): number => {
      const data = context.getImageData(
        Math.round(box.left),
        Math.round(box.top),
        Math.max(1, Math.round(box.width)),
        Math.max(1, Math.round(box.height)),
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
      leaked: share([255, 0, 255], {
        left: 0,
        top: 0,
        width: capture.width,
        height: capture.height,
      }),
      covered: share([107, 114, 128], {
        left: pictured.left + 4,
        top: pictured.top + 4,
        width: pictured.width - 8,
        height: pictured.height - 8,
      }),
      drawings,
    };
  }, situation);
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

test.describe('A surface is pictured as its frame shows it', () => {
  test('a page shorter than its frame is drawn at its size, on the colour of the page', async ({
    page,
  }) => {
    const frame = await restSandboxFrame(page);
    await startupNoticeGone(page);
    const short = await markerInAShortSurface(frame);

    const [inside, above, below] = await markerShares(page, short.marker);
    const beyond = await takeAndSample(page, { size: 'plain' }, PAGE, [
      await placeOnScreen(page, short.belowThePage),
    ]);

    expect(inside).toBeGreaterThan(0.98);
    expect(above).toBeLessThan(0.02);
    expect(below).toBeLessThan(0.02);
    expect(beyond.shares[0]).toBeGreaterThan(0.98);
  });

  test('a scrolled page is drawn where it is scrolled to, not squashed', async ({
    page,
  }) => {
    const frame = await restSandboxFrame(page);
    await startupNoticeGone(page);

    const [inside, above, below] = await markerShares(
      page,
      await markerInAScrolledSurface(frame),
    );

    expect(inside).toBeGreaterThan(0.98);
    expect(above).toBeLessThan(0.02);
    expect(below).toBeLessThan(0.02);
  });

  for (const situation of [
    'moves once asked',
    'moves once drawn',
    'fixed and scrolled',
  ] as const) {
    test(`what it withholds is covered where it was pictured: ${situation}`, async ({
      page,
    }) => {
      const frame = await restSandboxFrame(page);

      const picture = await pictureOfWhatIsWithheld(frame, situation);

      expect(picture.leaked).toBeLessThan(0.001);
      expect(picture.covered).toBeGreaterThan(0.6);
      expect(picture.drawings).toBe(1);
    });
  }
});
