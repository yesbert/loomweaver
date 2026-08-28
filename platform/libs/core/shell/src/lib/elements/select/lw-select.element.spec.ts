import {
  defineLwSelect,
  LW_OPTION_TAG,
  LW_SELECT_CHANGE,
  LW_SELECT_TAG,
} from './lw-select.element';

const LANGS: readonly [string, string, string][] = [
  ['en', 'English', '🇬🇧'],
  ['de', 'Deutsch', '🇩🇪'],
];

function mount(value?: string): HTMLElement {
  const select = document.createElement(LW_SELECT_TAG);
  select.setAttribute('label', 'Language');
  if (value) {
    select.setAttribute('value', value);
  }
  for (const [v, label, icon] of LANGS) {
    const option = document.createElement(LW_OPTION_TAG);
    option.setAttribute('value', v);
    option.setAttribute('icon', icon);
    option.textContent = label;
    select.append(option);
  }
  document.body.append(select);
  return select;
}

const trigger = (el: HTMLElement) =>
  el.querySelector<HTMLButtonElement>('.lw-select-trigger')!;
const options = (el: HTMLElement) => [
  ...el.querySelectorAll<HTMLElement>('[role="option"]'),
];
const key = (el: HTMLElement, target: Element, k: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('<lw-select> custom element', () => {
  beforeAll(() => defineLwSelect());
  afterEach(() => document.body.replaceChildren());

  it('registers both tags', () => {
    expect(customElements.get(LW_SELECT_TAG)).toBeDefined();
    expect(customElements.get(LW_OPTION_TAG)).toBeDefined();
  });

  it('shows the selected value (glyph + label) and the accessible label on the trigger', () => {
    const el = mount('de');
    expect(trigger(el).textContent).toContain('Deutsch');
    expect(trigger(el).textContent).toContain('🇩🇪');
    expect(trigger(el).getAttribute('aria-label')).toBe('Language');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the placeholder when nothing is selected', () => {
    const el = mount();
    el.setAttribute('placeholder', 'Choose…');
    expect(trigger(el).textContent).toContain('Choose…');
  });

  it('opens a listbox of options with the current one marked selected', () => {
    const el = mount('en');
    trigger(el).click();
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    const opts = options(el);
    expect(opts.map((o) => o.dataset['value'])).toEqual(['en', 'de']);
    expect(opts[0].getAttribute('aria-selected')).toBe('true');
    expect(opts[1].getAttribute('aria-selected')).toBe('false');
  });

  it('emits lw-select-change and updates the value when an option is clicked', () => {
    const el = mount('en');
    const onChange = vi.fn();
    el.addEventListener(LW_SELECT_CHANGE, (e) =>
      onChange((e as CustomEvent).detail.value),
    );

    trigger(el).click();
    options(el)[1].click();

    expect(onChange).toHaveBeenCalledWith('de');
    expect(el.getAttribute('value')).toBe('de');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
    expect(trigger(el).textContent).toContain('Deutsch');
  });

  it('does NOT emit when the value is set programmatically (no feedback loop)', () => {
    const el = mount('en');
    const onChange = vi.fn();
    el.addEventListener(LW_SELECT_CHANGE, onChange);

    el.setAttribute('value', 'de');

    expect(onChange).not.toHaveBeenCalled();
    expect(trigger(el).textContent).toContain('Deutsch');
  });

  it('navigates with the keyboard: ArrowDown roves, Enter selects', () => {
    const el = mount('en');
    const onChange = vi.fn();
    el.addEventListener(LW_SELECT_CHANGE, (e) =>
      onChange((e as CustomEvent).detail.value),
    );

    trigger(el).click();
    const listbox = el.querySelector('[role="listbox"]')!;
    key(el, listbox, 'ArrowDown');
    key(el, listbox, 'Enter');

    expect(onChange).toHaveBeenCalledWith('de');
    expect(el.getAttribute('value')).toBe('de');
  });

  it('closes on Escape without changing the value', () => {
    const el = mount('en');
    trigger(el).click();
    key(el, el.querySelector('[role="listbox"]')!, 'Escape');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
    expect(el.getAttribute('value')).toBe('en');
  });

  it('opens from the trigger keyboard (Space) and a second trigger click closes it', () => {
    const el = mount('en');
    key(el, trigger(el), ' ');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    trigger(el).click();
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('ArrowUp wraps to the last option', () => {
    const el = mount('en');
    trigger(el).click();
    key(el, el.querySelector('[role="listbox"]')!, 'ArrowUp');
    key(el, el.querySelector('[role="listbox"]')!, 'Enter');
    expect(el.getAttribute('value')).toBe('de');
  });

  it('Home and End move the active option to the first/last', () => {
    const el = mount('en');
    trigger(el).click();
    const listbox = el.querySelector('[role="listbox"]')!;
    key(el, listbox, 'End');
    expect(options(el)[1].classList.contains('is-active')).toBe(true);
    key(el, listbox, 'Home');
    expect(options(el)[0].classList.contains('is-active')).toBe(true);
  });

  it('typeahead jumps to the first option matching the typed prefix', () => {
    const el = mount('en');
    trigger(el).click();
    key(el, el.querySelector('[role="listbox"]')!, 'd');
    expect(options(el)[1].classList.contains('is-active')).toBe(true);
  });

  it('pointermove over an option makes it the active one', () => {
    const el = mount('en');
    trigger(el).click();
    options(el)[1].dispatchEvent(new Event('pointermove', { bubbles: true }));
    expect(options(el)[1].classList.contains('is-active')).toBe(true);
  });

  it('closes on Tab without changing the value', () => {
    const el = mount('en');
    trigger(el).click();
    key(el, el.querySelector('[role="listbox"]')!, 'Tab');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
    expect(el.getAttribute('value')).toBe('en');
  });

  it('closes when a pointerdown lands outside the element', () => {
    const el = mount('en');
    trigger(el).click();
    document.dispatchEvent(new Event('pointerdown'));
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('disables its trigger and does not open while the select is disabled', () => {
    const el = mount('en');
    el.setAttribute('disabled', '');

    expect(trigger(el).disabled).toBe(true);

    trigger(el).click();
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');

    el.removeAttribute('disabled');
    expect(trigger(el).disabled).toBe(false);
  });

  it('closes an open listbox when disabled at runtime', () => {
    const el = mount('en');
    trigger(el).click();
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');

    el.setAttribute('disabled', '');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('does not commit a disabled option and skips it in typeahead', () => {
    const el = mount('en');
    const disabled = document.createElement(LW_OPTION_TAG);
    disabled.setAttribute('value', 'fr');
    disabled.setAttribute('disabled', '');
    disabled.textContent = 'Français';
    el.append(disabled);
    const onChange = vi.fn();
    el.addEventListener(LW_SELECT_CHANGE, onChange);

    trigger(el).click();
    options(el)[2].click();

    expect(onChange).not.toHaveBeenCalled();
    expect(el.getAttribute('value')).toBe('en');
  });
});
