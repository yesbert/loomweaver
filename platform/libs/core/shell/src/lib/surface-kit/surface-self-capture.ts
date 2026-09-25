import { captureScale, drawAbsent } from './picture-primitives';
import type {
  LwSurfaceCapture,
  LwSurfaceCaptureRequest,
} from './surface-kit.frame';

interface SnapdomGlobal {
  readonly snapdom: {
    toCanvas(
      target: Element,
      options: { readonly scale: number },
    ): Promise<HTMLCanvasElement>;
  };
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

function withheldAreas(root: Element, attribute: string): Element[] {
  return [...root.querySelectorAll(`[${CSS.escape(attribute)}]`)].filter(
    (element) =>
      element !== document.body && element !== document.documentElement,
  );
}

function hideWithheld(
  canvas: HTMLCanvasElement,
  root: Element,
  scale: number,
  withheld: { readonly attribute: string; readonly label: string },
): void {
  const areas = withheldAreas(root, withheld.attribute);
  if (areas.length === 0) {
    return;
  }
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }
  const origin = root.getBoundingClientRect();
  for (const area of areas) {
    const rect = area.getBoundingClientRect();
    drawAbsent(
      context,
      (rect.left - origin.left) * scale,
      (rect.top - origin.top) * scale,
      rect.width * scale,
      rect.height * scale,
      withheld.label,
    );
  }
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
  const canvas = await renderer.snapdom.toCanvas(target, { scale });
  hideWithheld(canvas, target, scale, {
    attribute: withholdAttribute,
    label: request?.withheldLabel ?? '',
  });
  return {
    image: canvas.toDataURL(
      request?.mediaType ?? 'image/png',
      request?.quality,
    ),
    width: canvas.width,
    height: canvas.height,
  };
}
