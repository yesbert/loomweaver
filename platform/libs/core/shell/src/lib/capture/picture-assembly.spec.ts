import { describe, expect, it, vi } from 'vitest';
import { placeCover, placeSurface } from './picture-assembly';

const LABELS = { absent: 'Isolated surface — content not included' };

const DRAWING = { width: 800, height: 600 } as unknown as CanvasImageSource;

function recordingContext(): {
  context: CanvasRenderingContext2D;
  drawn: unknown[][];
  filled: number[][];
  texts: string[];
} {
  const drawn: unknown[][] = [];
  const filled: number[][] = [];
  const texts: string[] = [];
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: (...args: unknown[]) => {
      drawn.push(args);
    },
    fillRect: (...args: number[]) => {
      filled.push(args);
    },
    fillText: (text: string) => {
      texts.push(text);
    },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    textAlign: '',
    textBaseline: '',
    font: '',
  } as unknown as CanvasRenderingContext2D;
  return { context, drawn, filled, texts };
}

describe('placeSurface', () => {
  it('places a drawing where the surface sits, at the scale of the picture', () => {
    const { context, drawn } = recordingContext();

    placeSurface(
      context,
      {
        left: 100,
        top: 50,
        width: 400,
        height: 300,
        image: DRAWING,
      },
      2,
      LABELS,
    );

    expect(drawn).toHaveLength(1);
    expect(drawn[0].slice(1)).toEqual([200, 100, 800, 600]);
  });

  it('says an absent surface is absent rather than leaving it blank', () => {
    const { context, drawn, filled, texts } = recordingContext();

    placeSurface(
      context,
      { left: 10, top: 20, width: 300, height: 200, image: undefined },
      1,
      LABELS,
    );

    expect(drawn).toHaveLength(0);
    expect(filled).toEqual([[10, 20, 300, 200]]);
    expect(texts).toEqual([LABELS.absent]);
  });
});

describe('placeCover', () => {
  it('draws what covers a surface where it sits, and only within the surfaces it covers', () => {
    const { context, drawn } = recordingContext();

    placeCover(
      context,
      { left: 300, top: 200, width: 180, height: 120, image: DRAWING },
      [{ left: 100, top: 100, width: 400, height: 300 }],
      2,
    );

    expect(context.rect).toHaveBeenCalledExactlyOnceWith(200, 200, 800, 600);
    expect(context.clip).toHaveBeenCalledTimes(1);
    expect(drawn).toEqual([[DRAWING, 600, 400, 360, 240]]);
    expect(context.restore).toHaveBeenCalledTimes(1);
  });
});
