import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RovingTabs } from './roving-tabs.directive';

@Component({
  imports: [RovingTabs],
  template: `
    <div role="tablist" lwRovingTabs>
      @for (name of names(); track name) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="name === selected()"
        >
          {{ name }}
        </button>
      }
      <div role="tablist">
        <button type="button" role="tab" aria-selected="true">inner</button>
      </div>
    </div>
    <button type="button">after</button>
  `,
})
class Host {
  readonly names = signal(['one', 'two', 'three']);
  readonly selected = signal('two');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.autoDetectChanges();
  TestBed.tick();
  const root = fixture.nativeElement as HTMLElement;
  const tab = (name: string) =>
    [...root.querySelectorAll<HTMLElement>('[role="tab"]')].find(
      (candidate) => candidate.textContent?.trim() === name,
    ) as HTMLElement;
  const stops = () =>
    [...root.querySelectorAll<HTMLElement>('[role="tab"]')]
      .filter((candidate) => candidate.tabIndex === 0)
      .map((candidate) => candidate.textContent?.trim());
  const press = (
    target: HTMLElement,
    key: string,
    init: KeyboardEventInit = {},
  ) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    target.dispatchEvent(event);
    TestBed.tick();
    return event;
  };
  return { fixture, root, tab, stops, press };
}

describe('a tab strip walked with the arrow keys', () => {
  afterEach(() => document.body.replaceChildren());

  it('makes the selected tab the one stop of the strip', () => {
    const t = setup();

    expect(t.stops()).toEqual(['two', 'inner']);
  });

  it('moves the focus with the arrow keys and wraps at either end', () => {
    const t = setup();
    t.tab('two').focus();

    const right = t.press(t.tab('two'), 'ArrowRight');
    expect(document.activeElement).toBe(t.tab('three'));
    expect(right.defaultPrevented).toBe(true);

    t.press(t.tab('three'), 'ArrowRight');
    expect(document.activeElement).toBe(t.tab('one'));

    t.press(t.tab('one'), 'ArrowLeft');
    expect(document.activeElement).toBe(t.tab('three'));
  });

  it('jumps to the ends with Home and End', () => {
    const t = setup();
    t.tab('two').focus();

    t.press(t.tab('two'), 'End');
    expect(document.activeElement).toBe(t.tab('three'));

    t.press(t.tab('three'), 'Home');
    expect(document.activeElement).toBe(t.tab('one'));
  });

  it('carries the stop with the focus, without choosing', () => {
    const t = setup();
    t.tab('two').focus();

    t.press(t.tab('two'), 'ArrowRight');

    expect(t.stops()).toEqual(['three', 'inner']);
    expect(t.tab('two').getAttribute('aria-selected')).toBe('true');
    expect(t.tab('three').getAttribute('aria-selected')).toBe('false');
  });

  it('hands the stop back to the selected tab once the focus leaves', () => {
    const t = setup();
    t.tab('two').focus();
    t.press(t.tab('two'), 'ArrowRight');

    (t.root.querySelector('button:not([role])') as HTMLElement).focus();
    TestBed.tick();

    expect(t.stops()).toEqual(['two', 'inner']);
  });

  it('leaves a key pressed with a modifier to whoever else handles it', () => {
    const t = setup();
    t.tab('two').focus();

    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
      const event = t.press(t.tab('two'), 'ArrowRight', { [modifier]: true });
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(t.tab('two'));
    }
  });

  it('does not walk into a nested tab list', () => {
    const t = setup();
    t.tab('three').focus();

    t.press(t.tab('three'), 'ArrowRight');
    expect(document.activeElement).toBe(t.tab('one'));

    t.tab('inner').focus();
    const event = t.press(t.tab('inner'), 'ArrowRight');
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(t.tab('inner'));
  });

  it('gives the stop to the selected tab when the focused tab goes away', () => {
    const t = setup();
    t.tab('two').focus();
    t.press(t.tab('two'), 'ArrowRight');

    t.fixture.componentInstance.names.set(['one', 'two']);
    TestBed.tick();

    expect(t.stops()).toEqual(['two', 'inner']);
  });
});
