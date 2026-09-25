export interface DayPoint {
  readonly day: string;
  readonly count: number;
}

export const CHART = { width: 320, height: 96, pad: 6 } as const;

export function linePoints(
  values: readonly number[],
  width = CHART.width,
  height = CHART.height,
  pad = CHART.pad,
): string {
  if (values.length < 2) {
    return '';
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = (width - pad * 2) / (values.length - 1);
  return values
    .map((value, index) => {
      const x = pad + index * step;
      const y = height - pad - ((value - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function areaPath(
  values: readonly number[],
  width = CHART.width,
  height = CHART.height,
  pad = CHART.pad,
): string {
  const points = linePoints(values, width, height, pad);
  if (points === '') {
    return '';
  }
  return `M ${pad},${height} L ${points.replaceAll(' ', ' L ')} L ${width - pad},${height} Z`;
}
