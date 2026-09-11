import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { describe, expect, it, vi } from 'vitest';
import { SurfaceCapture } from './surface-capture';
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
    const answer: SurfaceCapture = { image: 'data:image/png;base64,AA==', width: 2, height: 1 };
    for (const top of [0, 120]) {
      registry.register({
        element: surfaceElement({ top, bottom: top + 100 }),
        captureSelf: async (scale) => {
          asked.push(scale);
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
    const scales = drawnAt(service);

    const picture = await service.capture();

    expect(scales).toEqual([window.devicePixelRatio]);
    expect(picture.width).toBe(Math.round(WORKBENCH_WIDTH * scales[0]));
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
    const scales = drawnAt(service);

    const picture = await service.capture({ size: { withinWidth: 1 } });

    expect(scales).toEqual([0.05]);
    expect(picture.image).toMatch(/^data:image\//);
  });

  it('asks a surface at the size the picture is drawn at', async () => {
    const { registry, service } = setUp();
    const asked: number[] = [];
    registry.register({
      element: surfaceElement({}),
      captureSelf: async (scale) => {
        asked.push(scale);
        return undefined;
      },
    });
    const scales = drawnAt(service);

    await service.capture({ size: { withinWidth: 600 } });

    expect(asked).toEqual(scales);
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

const STYLE_PROPERTIES = new Set([
  'fillStyle',
  'strokeStyle',
  'font',
  'textAlign',
  'textBaseline',
  'lineWidth',
]);

function drawnAt(service: WorkbenchCaptureService): number[] {
  const scales: number[] = [];
  vi.spyOn(service as unknown as { load(): unknown }, 'load').mockResolvedValue({
    toCanvas: async (_: Element, options: { scale: number }) => {
      scales.push(options.scale);
      return stubCanvas(options.scale);
    },
  });
  return scales;
}

function stubCanvas(scale = 1): HTMLCanvasElement {
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
    toDataURL: () => 'data:image/png;base64,AA==',
  } as unknown as HTMLCanvasElement;
}
