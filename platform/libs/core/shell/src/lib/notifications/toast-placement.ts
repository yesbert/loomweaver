import { ToastPosition } from './toast-options';

interface ToastPlacement {
  readonly region: string;
  readonly entering: string;
  readonly isNewestFirst: boolean;
}

const FROM_ABOVE = 'starting:-translate-y-2';
const FROM_BELOW = 'starting:translate-y-2';

const PLACEMENTS: Record<ToastPosition, ToastPlacement> = {
  'top-left': {
    region: 'top-0 md:items-start',
    entering: FROM_ABOVE,
    isNewestFirst: true,
  },
  'top-center': { region: 'top-0', entering: FROM_ABOVE, isNewestFirst: true },
  'top-right': {
    region: 'top-0 md:items-end',
    entering: FROM_ABOVE,
    isNewestFirst: true,
  },
  'bottom-left': {
    region: 'bottom-0 md:items-start',
    entering: FROM_BELOW,
    isNewestFirst: false,
  },
  'bottom-center': {
    region: 'bottom-0',
    entering: FROM_BELOW,
    isNewestFirst: false,
  },
  'bottom-right': {
    region: 'bottom-0 md:items-end',
    entering: FROM_BELOW,
    isNewestFirst: false,
  },
};

export function toastPlacement(position: ToastPosition): ToastPlacement {
  return PLACEMENTS[position];
}

export function knownToastPosition(position: ToastPosition): ToastPosition {
  if (!Object.hasOwn(PLACEMENTS, position)) {
    throw new Error(
      `provideShell: toastPosition '${String(position)}' is not one of ` +
        `${Object.keys(PLACEMENTS).join(', ')}.`,
    );
  }
  return position;
}
