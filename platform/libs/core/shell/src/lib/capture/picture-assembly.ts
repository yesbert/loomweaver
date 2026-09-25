import { drawAbsent } from '../surface-kit/picture-primitives';

export interface PlacedSurface {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly image: CanvasImageSource | undefined;
}

export interface AbsentSurfaceLabels {
  readonly absent: string;
}

export function placeSurface(
  context: CanvasRenderingContext2D,
  placed: PlacedSurface,
  scale: number,
  labels: AbsentSurfaceLabels,
): void {
  const left = placed.left * scale;
  const top = placed.top * scale;
  const width = placed.width * scale;
  const height = placed.height * scale;

  if (!placed.image) {
    drawAbsent(context, left, top, width, height, labels.absent);
    return;
  }
  context.drawImage(placed.image, left, top, width, height);
}
