import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LwSurfaceCapture } from '../surface-kit/surface-kit.frame';
import { SurfaceCaptureRegistry } from './surface-capture-registry';
import { WorkbenchCaptureService } from './workbench-capture.service';

const ABSENT = 'Isolated surface — content not included';

function surfaceElement(rect: Partial<DOMRect>): Element {
  const element = document.createElement('div');
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, ...rect }) as DOMRect;
  document.body.append(element);
  return element;
}

const WORKBENCH_WIDTH = 1440;

const WORKBENCH_HEIGHT = 860;

function setUp(): {
  registry: SurfaceCaptureRegistry;
  service: WorkbenchCaptureService;
} {
  document.body.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: WORKBENCH_WIDTH,
      height: WORKBENCH_HEIGHT,
      right: WORKBENCH_WIDTH,
      bottom: WORKBENCH_HEIGHT,
    }) as DOMRect;
  TestBed.configureTestingModule({
    providers: [
      SurfaceCaptureRegistry,
      WorkbenchCaptureService,
      { provide: TranslocoService, useValue: { translate: () => ABSENT } },
    ],
  });
  return {
    registry: TestBed.inject(SurfaceCaptureRegistry),
    service: TestBed.inject(WorkbenchCaptureService),
  };
}

describe('SurfaceCaptureRegistry', () => {
  it('lists a mounted surface and forgets it once it is gone', () => {
    const { registry } = setUp();
    const element = surfaceElement({});
    const surface = { element, captureSelf: async () => undefined };

    const unregister = registry.register(surface);
    expect(registry.visible()).toEqual([surface]);

    unregister();
    expect(registry.visible()).toEqual([]);
  });

  it('leaves out a surface that is no longer in the document', () => {
    const { registry } = setUp();
    const element = surfaceElement({});
    registry.register({ element, captureSelf: async () => undefined });

    element.remove();
    expect(registry.visible()).toEqual([]);
  });

  it('leaves out a surface with nothing on screen to draw', () => {
    const { registry } = setUp();
    const element = surfaceElement({ width: 0, height: 0, right: 0, bottom: 0 });
    registry.register({ element, captureSelf: async () => undefined });

    expect(registry.visible()).toEqual([]);
  });

  it('leaves out a surface scrolled past the edge of the window', () => {
    const { registry } = setUp();
    const element = surfaceElement({ top: -400, bottom: -200 });
    registry.register({ element, captureSelf: async () => undefined });

    expect(registry.visible()).toEqual([]);
  });

  it('leaves out a surface living in another window', () => {
    const { registry } = setUp();
    const elsewhere = document.implementation.createHTMLDocument('popout');
    const element = elsewhere.createElement('div');
    element.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect;
    elsewhere.body.append(element);
    registry.register({ element, captureSelf: async () => undefined });

    expect(registry.visible()).toEqual([]);
  });
});

describe('WorkbenchCaptureService', () => {
  it('asks every mounted surface for its drawing, at one scale', async () => {
    const { registry, service } = setUp();
    const asked: number[] = [];
    const answer: LwSurfaceCapture = { image: 'data:image/png;base64,AA==', width: 2, height: 1 };
    for (const top of [0, 120]) {
      registry.register({
        element: surfaceElement({ top, bottom: top + 100 }),
        captureSelf: async (drawing) => {
          asked.push(drawing.scale);
          return answer;
        },
      });
    }
    vi.spyOn(service as unknown as { load(): unknown }, 'load').mockResolvedValue({
      toCanvas: async () => stubCanvas(),
    });

    await service.capture();

    expect(asked).toHaveLength(2);
    expect(new Set(asked).size).toBe(1);
  });

  it('draws at the density of the screen when nothing is asked for', async () => {
    const { service } = setUp();
    const { scales } = drawnAt(service);

    const picture = await service.capture();

    expect(scales).toEqual([window.devicePixelRatio]);
    expect(picture.width).toBe(Math.round(WORKBENCH_WIDTH * scales[0]));
  });

  it('draws the size asked for on a screen with two device pixels to a CSS pixel', async () => {
    const { service } = setUp();
    vi.spyOn(globalThis, 'devicePixelRatio', 'get').mockReturnValue(2);
    drawnAt(service);

    const screen = await service.capture();
    const plain = await service.capture({ size: 'plain' });
    vi.restoreAllMocks();

    expect(screen.width).toBe(WORKBENCH_WIDTH * 2);
    expect(plain.width).toBe(WORKBENCH_WIDTH);
  });

  it('draws fewer pixels when asked for a plainer picture', async () => {
    const { service } = setUp();
    drawnAt(service);

    const screen = await service.capture();
    const plain = await service.capture({ size: 'plain' });

    expect(plain.width).toBeLessThanOrEqual(screen.width);
    expect(plain.width).toBe(WORKBENCH_WIDTH);
  });

  it('does not exceed a named width, and keeps the proportions', async () => {
    const { service } = setUp();
    drawnAt(service);

    const picture = await service.capture({ size: { withinWidth: 600 } });

    expect(picture.width).toBeLessThanOrEqual(600);
    expect(picture.width / picture.height).toBeCloseTo(
      WORKBENCH_WIDTH / WORKBENCH_HEIGHT,
      2,
    );
  });

  it('still answers a request beyond what it can draw', async () => {
    const { service } = setUp();
    const { scales } = drawnAt(service);

    const picture = await service.capture({ size: { withinWidth: 1 } });

    expect(scales).toEqual([0.05]);
    expect(picture.image).toMatch(/^data:image\//);
  });

  it('asks a surface at the size the picture is drawn at', async () => {
    const { registry, service } = setUp();
    const asked: number[] = [];
    registry.register({
      element: surfaceElement({}),
      captureSelf: async (drawing) => void asked.push(drawing.scale),
    });
    const { scales } = drawnAt(service);

    await service.capture({ size: { withinWidth: 600 } });

    expect(asked).toEqual(scales);
  });

  it('carries the picture losslessly when nothing is asked for', async () => {
    const { service } = setUp();
    const { encoded } = drawnAt(service);

    const picture = await service.capture();

    expect(encoded).toEqual([['image/png', undefined]]);
    expect(picture.form).toBe('lossless');
  });

  it('encodes in the form and strength asked for', async () => {
    const { service } = setUp();
    const { encoded } = drawnAt(service);

    const picture = await service.capture({
      form: { compressed: 'jpeg', quality: 0.5 },
    });

    expect(encoded).toEqual([['image/jpeg', 0.5]]);
    expect(picture.form).toBe('jpeg');
  });

  it('states the form it got when the browser substituted another', async () => {
    const { service } = setUp();
    drawnAt(service, 'image/png');

    const picture = await service.capture({ form: { compressed: 'webp' } });

    expect(picture.form).toBe('lossless');
    expect(picture.image).toMatch(/^data:image\/png;/);
  });

  it('asks a surface for the same form the picture is carried in', async () => {
    const { registry, service } = setUp();
    const asked: { mediaType: string; quality: number | undefined }[] = [];
    registry.register({
      element: surfaceElement({}),
      captureSelf: async ({ mediaType, quality }) =>
        void asked.push({ mediaType, quality }),
    });
    drawnAt(service);

    await service.capture({ form: { compressed: 'webp', quality: 0.6 } });

    expect(asked).toEqual([{ mediaType: 'image/webp', quality: 0.6 }]);
  });

  it('counts the surfaces whose content is absent', async () => {
    const { registry, service } = setUp();
    registry.register({
      element: surfaceElement({}),
      captureSelf: async () => undefined,
    });
    vi.spyOn(service as unknown as { load(): unknown }, 'load').mockResolvedValue({
      toCanvas: async () => stubCanvas(),
    });

    const picture = await service.capture();

    expect(picture.surfacesAbsent).toBe(1);
    expect(picture.image).toMatch(/^data:image\//);
  });
});

describe('a picture of what covers a surface', () => {
  afterEach(() => document.body.replaceChildren());

  const SURFACE = { left: 100, top: 100, width: 400, height: 300, right: 500, bottom: 400 };

  function absentSurface(
    registry: SurfaceCaptureRegistry,
    rect: Partial<DOMRect>,
  ): Element {
    const element = surfaceElement(rect);
    registry.register({ element, captureSelf: async () => undefined });
    return element;
  }

  it('draws a toast, an open menu and a dialog over the surface they cover', async () => {
    const { registry, service } = setUp();
    absentSurface(registry, SURFACE);
    const menu = layerElement(50, { left: 300, top: 200, width: 180, height: 120 });
    const dialog = layerElement(70, { left: 0, top: 0, width: 1440, height: 860 });
    const toast = layerElement(60, { left: 0, top: 0, width: 1440, height: 120 });
    const { rendered, steps } = pictured(service);

    await service.capture({ size: 'plain' });

    expect(rendered).toEqual([document.body, menu, toast, dialog]);
    expect(steps).toEqual([
      { surface: [100, 100, 400, 300] },
      { layer: menu, at: [300, 200, 180, 120], within: [[100, 100, 400, 300]] },
      { layer: toast, at: [0, 0, 1440, 120], within: [[100, 100, 400, 300]] },
      { layer: dialog, at: [0, 0, 1440, 860], within: [[100, 100, 400, 300]] },
    ]);
  });

  it('places what covers a surface at the scale of the picture', async () => {
    const { registry, service } = setUp();
    absentSurface(registry, SURFACE);
    const menu = layerElement(50, { left: 300, top: 200, width: 180, height: 120 });
    const { steps } = pictured(service);

    await service.capture({ size: { withinWidth: 720 } });

    expect(steps).toEqual([
      { surface: [50, 50, 200, 150] },
      { layer: menu, at: [150, 100, 90, 60], within: [[50, 50, 200, 150]] },
    ]);
  });

  it('does not draw again what covers no surface', async () => {
    const { registry, service } = setUp();
    absentSurface(registry, SURFACE);
    layerElement(50, { left: 600, top: 500, width: 180, height: 120 });
    const { rendered, steps } = pictured(service);

    await service.capture({ size: 'plain' });

    expect(rendered).toEqual([document.body]);
    expect(steps).toEqual([{ surface: [100, 100, 400, 300] }]);
  });

  it('draws a surface shown in a dialog above the dialog, and nothing beneath the dialog over it', async () => {
    const { registry, service } = setUp();
    absentSurface(registry, SURFACE);
    const toast = layerElement(60, { left: 0, top: 0, width: 1440, height: 200 });
    const dialog = layerElement(70, { left: 0, top: 0, width: 1440, height: 860 });
    dialog.append(
      absentSurface(registry, { left: 200, top: 150, width: 300, height: 200, right: 500, bottom: 350 }),
    );
    const { steps } = pictured(service);

    await service.capture({ size: 'plain' });

    expect(steps).toEqual([
      { surface: [100, 100, 400, 300] },
      { layer: toast, at: [0, 0, 1440, 200], within: [[100, 100, 400, 300]] },
      { layer: dialog, at: [0, 0, 1440, 860], within: [[100, 100, 400, 300]] },
      { surface: [200, 150, 300, 200] },
    ]);
  });
});

function layerElement(
  zIndex: number,
  box: { left: number; top: number; width: number; height: number },
): HTMLElement {
  const element = document.createElement('div');
  element.style.position = 'fixed';
  element.style.zIndex = String(zIndex);
  element.getBoundingClientRect = () =>
    ({ ...box, right: box.left + box.width, bottom: box.top + box.height }) as DOMRect;
  document.body.append(element);
  return element;
}

type PictureStep =
  | { surface: number[] }
  | { layer: Element; at: number[]; within: number[][] };

function pictured(service: WorkbenchCaptureService): {
  rendered: Element[];
  steps: PictureStep[];
} {
  const rendered: Element[] = [];
  const steps: PictureStep[] = [];
  let path: number[][] = [];
  let clipped: number[][] = [];
  const context = {
    save: () => undefined,
    restore: () => {
      clipped = [];
    },
    beginPath: () => {
      path = [];
    },
    rect: (...box: number[]) => {
      path.push(box);
    },
    clip: () => {
      clipped = path;
    },
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
    fillText: () => undefined,
    fillRect: (...box: number[]) => {
      steps.push({ surface: box });
    },
    drawImage: (image: { layer: Element }, ...at: number[]) => {
      steps.push({ layer: image.layer, at, within: clipped });
    },
  };
  vi.spyOn(service as unknown as { load(): unknown }, 'load').mockResolvedValue({
    toCanvas: async (target: Element) => {
      rendered.push(target);
      return target === document.body
        ? { ...stubCanvas(), getContext: () => context }
        : { layer: target };
    },
  });
  return { rendered, steps };
}

const STYLE_PROPERTIES = new Set([
  'fillStyle',
  'strokeStyle',
  'font',
  'textAlign',
  'textBaseline',
  'lineWidth',
]);

function drawnAt(
  service: WorkbenchCaptureService,
  encodeAs?: string,
): { scales: number[]; encoded: [string, number | undefined][] } {
  const scales: number[] = [];
  const encoded: [string, number | undefined][] = [];
  vi.spyOn(service as unknown as { load(): unknown }, 'load').mockResolvedValue({
    toCanvas: async (_: Element, options: { scale: number; dpr?: number }) => {
      scales.push(options.scale);
      return stubCanvas(
        options.scale * (options.dpr ?? globalThis.devicePixelRatio),
        encoded,
        encodeAs,
      );
    },
  });
  return { scales, encoded };
}

function stubCanvas(
  scale = 1,
  encoded: [string, number | undefined][] = [],
  encodeAs?: string,
): HTMLCanvasElement {
  const context = new Proxy(
    {},
    {
      get: (_, property) =>
        STYLE_PROPERTIES.has(property as string) ? '' : () => undefined,
      set: () => true,
    },
  );
  return {
    width: Math.round(WORKBENCH_WIDTH * scale),
    height: Math.round(WORKBENCH_HEIGHT * scale),
    getContext: () => context,
    toDataURL: (mediaType = 'image/png', quality?: number) => {
      encoded.push([mediaType, quality]);
      return `data:${encodeAs ?? mediaType};base64,AA==`;
    },
  } as unknown as HTMLCanvasElement;
}
