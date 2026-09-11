import { Frame, Page, expect, test } from '@playwright/test';

async function sandboxFrame(page: Page): Promise<Frame> {
  await page.goto('/sandbox-static');
  const element = page.locator('iframe[src*="/sandbox-static/view.html"]');
  await expect(element).toBeAttached({ timeout: 20_000 });
  const frame = await element
    .elementHandle()
    .then((handle) => handle?.contentFrame());
  if (!frame) {
    throw new Error('the sandboxed surface never attached a document');
  }
  await frame.waitForFunction(() => 'LwFrame' in globalThis, undefined, {
    timeout: 20_000,
  });
  return frame;
}

interface Drawn {
  readonly coveredShare: number;
  readonly width: number;
  readonly height: number;
}

async function drawAndSample(frame: Frame, selector: string): Promise<Drawn> {
  return frame.evaluate(async (target: string) => {
    const api = (globalThis as Record<string, unknown>)['LwFrame'] as {
      capture(request?: {
        scale?: number;
        withheldLabel?: string;
      }): Promise<{ image: string; width: number; height: number }>;
    };
    const capture = await api.capture({ scale: 1, withheldLabel: 'Content not included' });

    const element = document.querySelector(target);
    const rect = element!.getBoundingClientRect();
    const origin = document.body.getBoundingClientRect();

    const image = document.createElement('img');
    await new Promise((resolve) => {
      image.addEventListener('load', resolve);
      image.src = capture.image;
    });
    const canvas = document.createElement('canvas');
    canvas.width = capture.width;
    canvas.height = capture.height;
    canvas.getContext('2d')!.drawImage(image, 0, 0);

    const data = canvas
      .getContext('2d')!
      .getImageData(
        Math.max(0, Math.round(rect.left - origin.left) + 4),
        Math.max(0, Math.round(rect.top - origin.top) + 4),
        Math.max(1, Math.round(rect.width) - 8),
        Math.max(1, Math.round(rect.height) - 8),
      ).data;

    let covered = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i] - 107) < 10 &&
        Math.abs(data[i + 1] - 114) < 10 &&
        Math.abs(data[i + 2] - 128) < 10
      ) {
        covered += 1;
      }
    }
    return {
      coveredShare: covered / (data.length / 4),
      width: capture.width,
      height: capture.height,
    };
  }, selector);
}

test.describe('A surface can keep part of itself off the picture', () => {
  test('a marked area is covered rather than drawn', async ({ page }) => {
    const frame = await sandboxFrame(page);

    const marked = await drawAndSample(frame, '#withheld-demo');
    const ordinary = await drawAndSample(frame, '#whole-surface-demo');

    expect(marked.coveredShare).toBeGreaterThan(0.6);
    expect(ordinary.coveredShare).toBeLessThan(0.02);
  });

  test('marking the surface root withholds nothing', async ({ page }) => {
    const frame = await sandboxFrame(page);

    const covered = await frame.evaluate(async () => {
      document.body.setAttribute('data-lw-withhold', '');
      const api = (globalThis as Record<string, unknown>)['LwFrame'] as {
        capture(request?: {
          scale?: number;
          withheldLabel?: string;
        }): Promise<{ image: string; width: number; height: number }>;
      };
      const capture = await api.capture({ scale: 1, withheldLabel: 'x' });
      document.body.removeAttribute('data-lw-withhold');

      const image = document.createElement('img');
      await new Promise((resolve) => {
        image.addEventListener('load', resolve);
        image.src = capture.image;
      });
      const canvas = document.createElement('canvas');
      canvas.width = capture.width;
      canvas.height = capture.height;
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      const data = canvas
        .getContext('2d')!
        .getImageData(0, 0, capture.width, capture.height).data;

      let grey = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (
          Math.abs(data[i] - 107) < 26 &&
          Math.abs(data[i + 1] - 114) < 26 &&
          Math.abs(data[i + 2] - 128) < 26
        ) {
          grey += 1;
        }
      }
      return grey / (capture.width * capture.height);
    });

    expect(covered).toBeLessThan(0.5);
  });

  test('the surface is never told that a picture is being made', async ({
    page,
  }) => {
    const frame = await sandboxFrame(page);

    const events = await frame.evaluate(async () => {
      const seen: string[] = [];
      const record = (event: Event) => {
        seen.push(event.type);
      };
      for (const name of ['lwcapture', 'beforecapture', 'capture']) {
        globalThis.addEventListener(name, record);
      }
      const api = (globalThis as Record<string, unknown>)['LwFrame'] as {
        capture(request?: { scale?: number }): Promise<unknown>;
      };
      await api.capture({ scale: 1 });
      return seen;
    });

    expect(events).toEqual([]);
  });
});
