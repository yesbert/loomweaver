import { ToastPosition } from './toast-options';

export interface ToastPlacement {
  readonly region: string;
  readonly entering: string;
  readonly newestFirst: boolean;
}

type Edge = 'top' | 'bottom';
type Side = 'left' | 'center' | 'right';

const EDGE: Record<Edge, Omit<ToastPlacement, 'region'> & { at: string }> = {
  top: { at: 'top-0', entering: 'starting:-translate-y-2', newestFirst: true },
  bottom: {
    at: 'bottom-0',
    entering: 'starting:translate-y-2',
    newestFirst: false,
  },
};

const SIDE: Record<Side, string> = {
  left: 'md:items-start',
  center: '',
  right: 'md:items-end',
};

export function toastPlacement(position: ToastPosition): ToastPlacement {
  const [edge, side] = position.split('-') as [Edge, Side];
  const { at, entering, newestFirst } = EDGE[edge];
  return { region: `${at} ${SIDE[side]}`.trim(), entering, newestFirst };
}
