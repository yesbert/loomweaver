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

function setUp(): {
  registry: SurfaceCaptureRegistry;
  service: WorkbenchCaptureService;
} {
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

function stubCanvas(): HTMLCanvasElement {
  const context = new Proxy(
    {},
    {
      get: (_, property) =>
        STYLE_PROPERTIES.has(property as string) ? '' : () => undefined,
      set: () => true,
    },
  );
  return {
    width: 800,
    height: 600,
    getContext: () => context,
    toDataURL: () => 'data:image/png;base64,AA==',
  } as unknown as HTMLCanvasElement;
}
