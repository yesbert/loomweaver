import { defineLwTooltip } from './lw-tooltip.element';

defineLwTooltip();

describe('<lw-tooltip> and the Escape key', () => {
  const open = new Set<Element>();
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  const original = { show: proto.showPopover, hide: proto.hidePopover };

  beforeEach(() => {
    vi.useFakeTimers();
    proto.showPopover = function (this: Element) {
      open.add(this);
    };
    proto.hidePopover = function (this: Element) {
      open.delete(this);
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    proto.showPopover = original.show;
    proto.hidePopover = original.hide;
    open.clear();
    document.body.replaceChildren();
  });

  function shownOnFocus(): HTMLButtonElement {
    const button = document.createElement('button');
    const tooltip = document.createElement('lw-tooltip');
    tooltip.setAttribute('text', 'Split right');
    button.append(tooltip);
    document.body.append(button);
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.advanceTimersByTime(1000);
    return button;
  }

  it('hides a shown tooltip on Escape without moving focus, and takes that Escape', () => {
    shownOnFocus();
    expect(open.size).toBe(1);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(escape);

    expect(open.size).toBe(0);
    expect(escape.defaultPrevented).toBe(true);
  });

  it('hides on an Escape pressed in an open menu and leaves that Escape to the menu', () => {
    shownOnFocus();
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    const entry = document.createElement('div');
    entry.setAttribute('role', 'menuitem');
    menu.append(entry);
    document.body.append(menu);
    const heard = vi.fn();
    menu.addEventListener('keydown', heard);

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    entry.dispatchEvent(escape);

    expect(open.size).toBe(0);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(escape.defaultPrevented).toBe(false);
  });

  it('leaves an Escape alone while no tooltip is shown', () => {
    shownOnFocus();
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );

    const second = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(second);

    expect(second.defaultPrevented).toBe(false);
  });
});
