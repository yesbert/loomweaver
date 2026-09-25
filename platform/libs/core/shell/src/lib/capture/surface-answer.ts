import type { LwSurfaceCapture } from '../surface-kit/surface-kit.frame';

const MAX_IMAGE_LENGTH = 32 * 1024 * 1024;

const MAX_EDGE = 16_384;

const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

function isEdge(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= MAX_EDGE
  );
}

export function readSurfaceCapture(
  answer: unknown,
): LwSurfaceCapture | undefined {
  if (typeof answer !== 'object' || answer === null) {
    return undefined;
  }
  const { image, width, height } = answer as Record<string, unknown>;
  if (typeof image !== 'string' || image.length > MAX_IMAGE_LENGTH) {
    return undefined;
  }
  if (!DATA_IMAGE.test(image)) {
    return undefined;
  }
  if (!isEdge(width) || !isEdge(height)) {
    return undefined;
  }
  return { image, width, height };
}
