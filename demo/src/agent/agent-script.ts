import { activeLook } from '../looks/look-choice';
import { LOOKS } from '../looks/looks';

export type BeatId =
  | 'openQuote'
  | 'overview'
  | 'sendQuote'
  | 'margin'
  | 'look';

export interface ToolCall {
  readonly commandId: string;
  args(): Readonly<Record<string, string>>;
}

export interface Beat {
  readonly id: BeatId;
  readonly call: ToolCall;
  readonly warnsBeforeCalling?: boolean;
  words?(): Readonly<Record<string, string>>;
}

function nextLook(): (typeof LOOKS)[number] {
  const at = LOOKS.findIndex((look) => look.id === activeLook.id);
  return LOOKS[(at + 1) % LOOKS.length];
}

export const BEATS: readonly Beat[] = [
  {
    id: 'openQuote',
    call: { commandId: 'quotes.open', args: () => ({ number: 'Q-0007' }) },
  },
  {
    id: 'overview',
    call: { commandId: 'insights.overview', args: () => ({}) },
  },
  {
    id: 'sendQuote',
    call: { commandId: 'quotes.send', args: () => ({ number: 'Q-0004' }) },
  },
  {
    id: 'margin',
    call: { commandId: 'quotes.margin', args: () => ({ number: 'Q-0007' }) },
  },
  {
    id: 'look',
    warnsBeforeCalling: true,
    call: { commandId: 'looks.switch', args: () => ({ look: nextLook().id }) },
    words: () => ({ look: nextLook().label }),
  },
];
