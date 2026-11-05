import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureSelf } from './surface-self-capture';

const ATTRIBUTE = 'data-lw-withhold';

const PAGE = { name: 'the whole page' } as unknown as HTMLCanvasElement;

const FRAME = { width: 400, height: 300 };

type Step =
  | { readonly fill: string; readonly box: readonly number[] }
  | { readonly image: unknown; readonly at: readonly number[] };

interface Plugin {
  afterClone(copy: { clone?: Element | null }): void;
}

interface Asked {
  readonly target: Element;
  readonly options: { scale: number; dpr: number; plugins: Plugin[] };
}

function withheldArea(box: {
  left: number;
  top: number;
  width: number;
  height: number;
}): { element: HTMLElement; moveTo(top: number): void } {
  let top = box.top;
  const element = document.createElement('p');
  element.setAttribute(ATTRIBUTE, '');
  element.append(document.createElement('b'));
  element.getBoundingClientRect = () => ({ ...box, top }) as DOMRect;
  document.body.append(element);
  return {
    element,
    moveTo: (next) => {
      top = next;
    },
  };
}

describe('a surface drawing itself', () => {
  let asked: Asked[];
  let copies: Element[];
  let steps: Step[];
  let view: { width: number; height: number };

  function renderer(
    around: { beforeCopying?(): void; afterCopying?(): void } = {},
    copies_ = true,
  ): void {
    (globalThis as Record<string, unknown>)['LwSnapdom'] = {
      snapdom: {
        toCanvas: async (target: Element, options: Asked['options']) => {
          asked.push({ target, options });
          around.beforeCopying?.();
          if (copies_) {
            const clone = target.cloneNode(true) as Element;
            copies.push(clone);
            options.plugins[0].afterClone({ clone });
          }
          around.afterCopying?.();
          return PAGE;
        },
      },
    };
  }

  const covers = (): readonly (readonly number[])[] =>
    steps.flatMap((step) =>
      'fill' in step && step.fill === '#6b7280' ? [step.box] : [],
    );

  beforeEach(() => {
    asked = [];
    copies = [];
    steps = [];
    view = { width: 0, height: 0 };
    vi.spyOn(globalThis, 'innerWidth', 'get').mockReturnValue(FRAME.width);
    vi.spyOn(globalThis, 'innerHeight', 'get').mockReturnValue(FRAME.height);
    vi.spyOn(document.head, 'append').mockImplementation((...nodes) => {
      for (const node of nodes) {
        queueMicrotask(() => (node as Node).dispatchEvent(new Event('load')));
      }
    });
    const context = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      textAlign: '',
      textBaseline: '',
      font: '',
      save: () => undefined,
      restore: () => undefined,
      beginPath: () => undefined,
      rect: () => undefined,
      clip: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      fillText: () => undefined,
      fillRect: (...box: number[]) => {
        steps.push({ fill: context.fillStyle, box });
      },
      drawImage: (image: unknown, ...at: number[]) => {
        steps.push({ image, at });
      },
    };
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((
      tag: string,
    ) =>
      tag === 'canvas'
        ? Object.assign(view, {
            getContext: () => context,
            toDataURL: () => 'data:image/png;base64,view',
          })
        : createElement(tag)) as typeof document.createElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
    document.body.removeAttribute(ATTRIBUTE);
    document.body.removeAttribute('style');
    delete (globalThis as Record<string, unknown>)['LwSnapdom'];
  });

  it('draws its page and answers with the part its frame shows', async () => {
    renderer();
    document.body.getBoundingClientRect = () =>
      ({ left: 0, top: -700 }) as DOMRect;

    const answer = await captureSelf({ scale: 2 }, ATTRIBUTE);

    expect(asked).toHaveLength(1);
    expect(asked[0].target).toBe(document.body);
    expect(asked[0].options).toMatchObject({ scale: 2, dpr: 1 });
    expect(steps).toEqual([{ image: PAGE, at: [0, -1400] }]);
    expect(answer).toEqual({
      image: 'data:image/png;base64,view',
      width: 800,
      height: 600,
    });
  });

  it('paints the colour of the page where the page ends above the edge of its frame', async () => {
    renderer();
    document.body.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect;
    document.body.style.backgroundColor = 'rgb(247, 249, 251)';

    await captureSelf({ scale: 1 }, ATTRIBUTE);

    expect(steps).toEqual([
      { fill: 'rgb(247, 249, 251)', box: [0, 0, 400, 300] },
      { image: PAGE, at: [0, 0] },
    ]);
  });

  it('covers a withheld area where it sits in the frame, at the scale of the drawing', async () => {
    renderer();
    withheldArea({ left: 40, top: 100, width: 200, height: 50 });

    await captureSelf({ scale: 2 }, ATTRIBUTE);

    expect(covers()).toEqual([[80, 200, 400, 100]]);
  });

  it('hides what is withheld in the copy the renderer draws from, and leaves the page alone', async () => {
    renderer();
    const area = withheldArea({ left: 40, top: 100, width: 200, height: 50 });

    await captureSelf({ scale: 1 }, ATTRIBUTE);

    const copy = copies[0].querySelector<HTMLElement>(
      `[${CSS.escape(ATTRIBUTE)}]`,
    );
    const hidden = [copy, copy?.querySelector<HTMLElement>('b')].map(
      (element) => [
        element?.style.getPropertyValue('visibility'),
        element?.style.getPropertyPriority('visibility'),
      ],
    );
    expect(hidden).toEqual([
      ['hidden', 'important'],
      ['hidden', 'important'],
    ]);
    expect(area.element.getAttribute('style')).toBeNull();
  });

  it('covers a withheld area where it was when the page was copied, though it moved before the drawing was done', async () => {
    const area = withheldArea({ left: 40, top: 100, width: 200, height: 50 });
    renderer({ afterCopying: () => area.moveTo(220) });

    await captureSelf({ scale: 1 }, ATTRIBUTE);

    expect(covers()).toEqual([[40, 100, 200, 50]]);
  });

  it('covers a withheld area where it was when the page was copied, though it moved after the drawing was asked for', async () => {
    const area = withheldArea({ left: 40, top: 100, width: 200, height: 50 });
    renderer({ beforeCopying: () => area.moveTo(220) });

    await captureSelf({ scale: 1 }, ATTRIBUTE);

    expect(covers()).toEqual([[40, 220, 200, 50]]);
  });

  it('withholds nothing for a mark on the surface as a whole', async () => {
    renderer();
    document.body.setAttribute(ATTRIBUTE, '');

    await captureSelf({ scale: 1 }, ATTRIBUTE);

    expect(covers()).toEqual([]);
    expect(copies[0].getAttribute('style')).toBeNull();
  });

  it('answers with no drawing when the renderer never showed the copy it drew from', async () => {
    renderer({}, false);
    withheldArea({ left: 40, top: 100, width: 200, height: 50 });

    await expect(captureSelf({ scale: 1 }, ATTRIBUTE)).rejects.toThrow(
      'without showing its copy',
    );
    expect(steps).toEqual([]);
  });
});
