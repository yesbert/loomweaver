import type {
  LwSurfaceCapture,
  LwSurfaceCaptureRequest,
} from '../surface-kit/surface-kit.frame';
import { withinDeadline } from './deadline';
import { PictureEncoding } from './picture-form';
import { readSurfaceCapture } from './surface-answer';

export const SURFACE_CAPTURE_TIMEOUT_MS = 4000;

export const DECODE_TIMEOUT_MS = 2000;

export interface DrawRequest extends PictureEncoding {
  readonly scale: number;
}

export type SurfaceDrawHook = (
  request: LwSurfaceCaptureRequest,
) => Promise<unknown>;

export function askSurfaceToDraw(
  hook: SurfaceDrawHook | undefined,
  request: DrawRequest,
  withheldLabel: string,
): Promise<LwSurfaceCapture | undefined> {
  if (typeof hook !== 'function') {
    return Promise.resolve(undefined);
  }
  return withinDeadline(
    Promise.resolve()
      .then(() => hook({ ...request, withheldLabel }))
      .then(readSurfaceCapture),
    SURFACE_CAPTURE_TIMEOUT_MS,
  );
}

export function decodeCapture(
  capture: LwSurfaceCapture | undefined,
  view: Window,
): Promise<CanvasImageSource | undefined> {
  if (!capture) {
    return Promise.resolve(undefined);
  }
  const decoded = new Promise<CanvasImageSource | undefined>((resolve) => {
    const image = view.document.createElement('img');
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => resolve(undefined));
    image.src = capture.image;
  });
  return withinDeadline(decoded, DECODE_TIMEOUT_MS).then(
    (result) => result ?? undefined,
  );
}
