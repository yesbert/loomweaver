import { defineLwTooltip, LW_TOOLTIP_TAG } from './lw-tooltip.element';
import type { Mock } from 'vitest';

function mount(attributes: Record<string, string>): HTMLElement {
  const element = document.createElement(LW_TOOLTIP_TAG);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
}

function mountInTrigger(attributes: Record<string, string>): {
  trigger: HTMLElement;
  bubble: HTMLElement;
  showPopover: Mock;
  hidePopover: Mock;
} {
  const trigger = document.createElement('button');
  const element = document.createElement(LW_TOOLTIP_TAG);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  trigger.append(element);
  document.body.append(trigger);
  const bubble = element.querySelector<HTMLElement>('[role="tooltip"]')!;
  const showPopover = vi.fn();
  const hidePopover = vi.fn();
  bubble.showPopover = showPopover;
  bubble.hidePopover = hidePopover;
  return { trigger, bubble, showPopover, hidePopover };
}

function pointer(
  type: 'pointerenter' | 'pointerleave',
  pointerType: 'mouse' | 'touch',
): Event {
  const event = new Event(type);
  Object.defineProperties(event, {
    pointerType: { value: pointerType },
    clientX: { value: 40 },
    clientY: { value: 20 },
  });
  return event;
}

describe('<lw-tooltip> custom element', () => {
  beforeAll(() => defineLwTooltip());
  afterEach(() => document.body.replaceChildren());

  it('is registered as a custom element', () => {
    expect(customElements.get(LW_TOOLTIP_TAG)).toBeDefined();
  });

  it('renders a tooltip bubble with the given text', () => {
    const bubble = mount({ text: 'Reset' }).querySelector('[role="tooltip"]');
    expect(bubble?.textContent?.trim()).toBe('Reset');
  });

  it('renders no bubble when the text is empty or whitespace', () => {
    expect(mount({ text: ' '.repeat(3) }).querySelector('[role="tooltip"]')).toBeNull();
    expect(mount({}).querySelector('[role="tooltip"]')).toBeNull();
  });

  it('reflects the position attribute (placement is computed in JS on show, not via CSS anchor)', () => {
    const element = mount({ text: 'Add', position: 'bottom' });
    const bubble = element.querySelector<HTMLElement>('[role="tooltip"]');
    expect((element as unknown as { position: string }).position).toBe('bottom');
    expect(bubble?.style.getPropertyValue('position-area')).toBe('');
    expect(element.style.getPropertyValue('anchor-name')).toBe('');
  });

  it('updates the bubble text when the attribute changes, and removes it when cleared', () => {
    const element = mount({ text: 'One' });
    element.setAttribute('text', 'Two');
    expect(element.querySelector('[role="tooltip"]')?.textContent).toBe('Two');
    element.setAttribute('text', '');
    expect(element.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('renders the bubble as a manual popover (top layer, #13)', () => {
    const bubble = mount({ text: 'Reset' }).querySelector<HTMLElement>(
      '[role="tooltip"]',
    );
    expect(bubble?.getAttribute('popover')).toBe('manual');
  });

  describe('reveal (JS-driven popover)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('shows + positions the bubble after the delay on a mouse enter, and hides on leave', () => {
      const { trigger, bubble, showPopover, hidePopover } = mountInTrigger({
        text: 'Add',
        'delay-ms': '600',
      });

      trigger.dispatchEvent(pointer('pointerenter', 'mouse'));
      expect(showPopover).not.toHaveBeenCalled();
      vi.advanceTimersByTime(600);
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(bubble.style.left).toBe('40px');
      expect(bubble.style.top).toBe('36px');

      trigger.dispatchEvent(pointer('pointerleave', 'mouse'));
      expect(hidePopover).toHaveBeenCalledTimes(1);
    });

    it('flips above the cursor with only a small gap near the viewport foot', () => {
      const { trigger, bubble, showPopover } = mountInTrigger({
        text: 'Add',
        'delay-ms': '0',
      });
      const enter = new Event('pointerenter');
      Object.defineProperties(enter, {
        pointerType: { value: 'mouse' },
        clientX: { value: 40 },
        clientY: {
          value: window.innerHeight - 8,
        },
      });
      trigger.dispatchEvent(enter);
      vi.advanceTimersByTime(0);

      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(bubble.style.top).toBe(`${window.innerHeight - 8 - 6}px`);
    });

    it('does not reveal for a touch pointer (no hover intent)', () => {
      const { trigger, showPopover } = mountInTrigger({ text: 'Add' });
      trigger.dispatchEvent(pointer('pointerenter', 'touch'));
      vi.advanceTimersByTime(1000);
      expect(showPopover).not.toHaveBeenCalled();
    });

    it('reveals on keyboard focus and hides on blur', () => {
      const { trigger, showPopover, hidePopover } = mountInTrigger({
        text: 'Add',
        'delay-ms': '0',
      });
      trigger.dispatchEvent(new FocusEvent('focusin'));
      vi.advanceTimersByTime(0);
      expect(showPopover).toHaveBeenCalledTimes(1);
      trigger.dispatchEvent(new FocusEvent('focusout'));
      expect(hidePopover).toHaveBeenCalledTimes(1);
    });

    it('cancels a pending reveal when the pointer leaves before the delay elapses', () => {
      const { trigger, showPopover } = mountInTrigger({
        text: 'Add',
        'delay-ms': '600',
      });
      trigger.dispatchEvent(pointer('pointerenter', 'mouse'));
      trigger.dispatchEvent(pointer('pointerleave', 'mouse'));
      vi.advanceTimersByTime(600);
      expect(showPopover).not.toHaveBeenCalled();
    });

    it('falls back to the default delay for an empty or non-numeric delay-ms (never reveals instantly)', () => {
      for (const value of ['', 'soon']) {
        const { trigger, showPopover } = mountInTrigger({
          text: 'Add',
          'delay-ms': value,
        });
        trigger.dispatchEvent(pointer('pointerenter', 'mouse'));
        vi.advanceTimersByTime(0);
        expect(showPopover).not.toHaveBeenCalled();
        vi.advanceTimersByTime(600);
        expect(showPopover).toHaveBeenCalledTimes(1);
        document.body.replaceChildren();
      }
    });
  });
});
