import { SurfaceCapture, withinDeadline } from './surface-capture';

export const DECODE_TIMEOUT_MS = 2000;

export function decodeDrawing(
  drawing: SurfaceCapture | undefined,
  view: Window,
): Promise<CanvasImageSource | undefined> {
  if (!drawing) {
    return Promise.resolve(undefined);
  }
  const decoded = new Promise<CanvasImageSource | undefined>((resolve) => {
    const image = view.document.createElement('img');
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => resolve(undefined));
    image.src = drawing.image;
  });
  return withinDeadline(decoded, DECODE_TIMEOUT_MS).then(
    (result) => result ?? undefined,
  );
}
