import { rovingStep } from '../roving-focus';
import { Choice } from './lw-select-parts';

const TYPEAHEAD_RESET_MS = 500;

export class Typeahead {
  private typed = '';

  private timer?: ReturnType<typeof setTimeout>;

  match(choices: readonly Choice[], char: string): number | undefined {
    this.typed += char.toLowerCase();
    this.clear();
    this.timer = setTimeout(() => (this.typed = ''), TYPEAHEAD_RESET_MS);
    const match = choices.findIndex(
      (choice) =>
        !choice.disabled && choice.label.toLowerCase().startsWith(this.typed),
    );
    return match === -1 ? undefined : match;
  }

  clear(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
    }
  }
}

export function isPrintable(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    event.key !== ' ' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}

export function selectedIndex(
  choices: readonly Choice[],
  value: string | null,
): number {
  const selected = choices.findIndex((choice) => choice.value === value);
  return selected === -1 ? (enabledIndices(choices)[0] ?? 0) : selected;
}

export function stepOverEnabled(
  choices: readonly Choice[],
  key: string,
  active: number,
): number | undefined {
  const enabled = enabledIndices(choices);
  const next = rovingStep(
    key,
    enabled.indexOf(active),
    enabled.length,
    'vertical',
  );
  return next === undefined ? undefined : enabled[next];
}

export function openingIndex(
  event: KeyboardEvent,
  choices: readonly Choice[],
  value: string | null,
  typeahead: Typeahead,
): number | undefined {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
    case 'Enter':
    case ' ': {
      return selectedIndex(choices, value);
    }
    case 'Home': {
      return enabledIndices(choices)[0];
    }
    case 'End': {
      return enabledIndices(choices).at(-1);
    }
    default: {
      return isPrintable(event)
        ? (typeahead.match(choices, event.key) ?? selectedIndex(choices, value))
        : undefined;
    }
  }
}

function enabledIndices(choices: readonly Choice[]): number[] {
  return choices.flatMap((choice, index) => (choice.disabled ? [] : [index]));
}
