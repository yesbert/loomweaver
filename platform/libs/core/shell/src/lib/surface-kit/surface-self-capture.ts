import {
  captureScale,
  drawAbsent,
  DrawingSize,
  drawingSize,
} from './picture-primitives';
import type {
  LwSurfaceCapture,
  LwSurfaceCaptureRequest,
} from './surface-kit.frame';

interface PageCopy {
  readonly clone?: Element | null;
}

interface RendererPlugin {
  readonly name: string;
  afterClone(copy: PageCopy): void;
}

interface SnapdomGlobal {
  readonly snapdom: {
    toCanvas(
      target: Element,
      options: DrawingSize & { readonly plugins: readonly RendererPlugin[] },
    ): Promise<HTMLCanvasElement>;
  };
}

interface WithheldArea {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface PageAsCopied {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly withheld: readonly WithheldArea[];
}

const rendererSource = new URL(
  'snapdom.global.js',
  (document.currentScript as HTMLScriptElement | null)?.src ?? location.href,
).href;

let rendererLoad: Promise<void> | undefined;

function loadRenderer(): Promise<void> {
  rendererLoad ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = rendererSource;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      rendererLoad = undefined;
      reject(
        new Error(
          `the surface renderer could not be loaded from ${rendererSource}`,
        ),
      );
    });
    document.head.append(script);
  });
  return rendererLoad;
}

function marked(root: ParentNode, attribute: string): readonly Element[] {
  const found = [...root.querySelectorAll(`[${CSS.escape(attribute)}]`)];
  for (const element of root.querySelectorAll('*')) {
    if (element.shadowRoot) {
      found.push(...marked(element.shadowRoot, attribute));
    }
  }
  return found;
}

function withheldAreas(attribute: string): readonly WithheldArea[] {
  return marked(document, attribute)
    .filter(
      (element) =>
        element !== document.body && element !== document.documentElement,
    )
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    });
}

function hideWithheldIn(copy: Element, attribute: string): void {
  for (const area of marked(copy, attribute)) {
    for (const element of [area, ...area.querySelectorAll('*')]) {
      (element as HTMLElement).style.setProperty(
        'visibility',
        'hidden',
        'important',
      );
    }
  }
}

function pageBackground(): string | undefined {
  return [document.documentElement, document.body]
    .map((element) => getComputedStyle(element).backgroundColor)
    .find((colour) => colour !== 'rgba(0, 0, 0, 0)' && colour !== 'transparent');
}

function whatTheFrameShows(
  page: HTMLCanvasElement,
  copied: PageAsCopied,
  scale: number,
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(innerWidth * scale);
  canvas.height = Math.round(innerHeight * scale);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('the surface has nothing to draw what its frame shows on');
  }
  const background = pageBackground();
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const drawnAt = page.width / copied.width;
  const zoom = Number.isFinite(drawnAt) && drawnAt > 0 ? scale / drawnAt : 1;
  context.drawImage(
    page,
    copied.left * scale,
    copied.top * scale,
    page.width * zoom,
    page.height * zoom,
  );
  return { canvas, context };
}

export async function captureSelf(
  request: LwSurfaceCaptureRequest | undefined,
  withholdAttribute: string,
): Promise<LwSurfaceCapture> {
  await loadRenderer();
  const renderer = (globalThis as Record<string, unknown>)['LwSnapdom'] as
    SnapdomGlobal | undefined;
  if (!renderer) {
    throw new Error('the surface renderer did not install itself');
  }
  const target = document.body ?? document.documentElement;
  const scale = captureScale(request?.scale ?? devicePixelRatio);
  const seen: { copied?: PageAsCopied } = {};
  const page = await renderer.snapdom.toCanvas(target, {
    ...drawingSize(scale),
    plugins: [
      {
        name: 'lw-withhold',
        afterClone: ({ clone }) => {
          if (!clone) {
            return;
          }
          hideWithheldIn(clone, withholdAttribute);
          const origin = target.getBoundingClientRect();
          seen.copied = {
            left: origin.left,
            top: origin.top,
            width: origin.width,
            withheld: withheldAreas(withholdAttribute),
          };
        },
      },
    ],
  });
  const copied = seen.copied;
  if (!copied) {
    throw new Error('the renderer drew the surface without showing its copy');
  }
  const { canvas, context } = whatTheFrameShows(page, copied, scale);
  for (const area of copied.withheld) {
    drawAbsent(
      context,
      area.left * scale,
      area.top * scale,
      area.width * scale,
      area.height * scale,
      request?.withheldLabel ?? '',
    );
  }
  return {
    image: canvas.toDataURL(
      request?.mediaType ?? 'image/png',
      request?.quality,
    ),
    width: canvas.width,
    height: canvas.height,
  };
}
