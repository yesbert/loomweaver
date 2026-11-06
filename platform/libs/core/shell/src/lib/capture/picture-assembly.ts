import { drawAbsent } from '../surface-kit/picture-primitives';

export interface PictureBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface PlacedSurface extends PictureBox {
  readonly image: CanvasImageSource | undefined;
}

export interface PlacedCover extends PictureBox {
  readonly image: CanvasImageSource;
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

export function placeCover(
  context: CanvasRenderingContext2D,
  cover: PlacedCover,
  over: readonly PictureBox[],
  scale: number,
): void {
  context.save();
  context.beginPath();
  for (const box of over) {
    context.rect(
      box.left * scale,
      box.top * scale,
      box.width * scale,
      box.height * scale,
    );
  }
  context.clip();
  context.drawImage(
    cover.image,
    cover.left * scale,
    cover.top * scale,
    cover.width * scale,
    cover.height * scale,
  );
  context.restore();
}
