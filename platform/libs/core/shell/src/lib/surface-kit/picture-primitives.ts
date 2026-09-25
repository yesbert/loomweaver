const SMALLEST_SCALE = 0.05;

const LARGEST_SCALE = 4;

export function captureScale(preferred: number): number {
  if (!Number.isFinite(preferred) || preferred <= 0) {
    return 1;
  }
  return Math.min(LARGEST_SCALE, Math.max(SMALLEST_SCALE, preferred));
}

const ABSENT_FILL = '#6b7280';

const ABSENT_STRIPE = 'rgba(255, 255, 255, 0.14)';

const ABSENT_TEXT = '#ffffff';

const STRIPE_STEP = 14;

export function drawAbsent(
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
