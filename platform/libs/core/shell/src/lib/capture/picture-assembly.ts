export interface PlacedSurface {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly drawing: CanvasImageSource | undefined;
}

export interface AbsentSurfaceLabels {
  readonly absent: string;
}

const ABSENT_FILL = '#6b7280';

const ABSENT_STRIPE = 'rgba(255, 255, 255, 0.14)';

const ABSENT_TEXT = '#ffffff';

const STRIPE_STEP = 14;

export function captureScale(preferred: number): number {
  if (!Number.isFinite(preferred) || preferred <= 0) {
    return 1;
  }
  return Math.min(3, Math.max(1, preferred));
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

  if (!placed.drawing) {
    drawAbsent(context, left, top, width, height, labels.absent);
    return;
  }
  context.drawImage(placed.drawing, left, top, width, height);
}

function drawAbsent(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  label: string,
): void {
  context.save();
  context.beginPath();
  context.rect(left, top, width, height);
  context.clip();

  context.fillStyle = ABSENT_FILL;
  context.fillRect(left, top, width, height);

  context.strokeStyle = ABSENT_STRIPE;
  context.lineWidth = 6;
  context.beginPath();
  for (let offset = -height; offset < width; offset += STRIPE_STEP * 2) {
    context.moveTo(left + offset, top + height);
    context.lineTo(left + offset + height, top);
  }
  context.stroke();

  context.fillStyle = ABSENT_TEXT;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `600 ${Math.max(11, Math.min(16, height / 14))}px system-ui, sans-serif`;
  context.fillText(label, left + width / 2, top + height / 2, width - 16);
  context.restore();
}
