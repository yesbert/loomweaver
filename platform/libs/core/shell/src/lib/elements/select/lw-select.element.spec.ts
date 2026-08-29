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

const trigger = (element: HTMLElement) =>
  element.querySelector<HTMLButtonElement>('.lw-select-trigger')!;
const options = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLElement>('[role="option"]'),
];
const key = (element: HTMLElement, target: Element, k: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('<lw-select> custom element', () => {
  beforeAll(() => defineLwSelect());
  afterEach(() => document.body.replaceChildren());

  it('registers both tags', () => {
    expect(customElements.get(LW_SELECT_TAG)).toBeDefined();
    expect(customElements.get(LW_OPTION_TAG)).toBeDefined();
  });

  it('shows the selected value (glyph + label) and the accessible label on the trigger', () => {
    const element = mount('de');
    expect(trigger(element).textContent).toContain('Deutsch');
    expect(trigger(element).textContent).toContain('🇩🇪');
    expect(trigger(element).getAttribute('aria-label')).toBe('Language');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the placeholder when nothing is selected', () => {
    const element = mount();
    element.setAttribute('placeholder', 'Choose…');
    expect(trigger(element).textContent).toContain('Choose…');
  });

  it('opens a listbox of options with the current one marked selected', () => {
    const element = mount('en');
    trigger(element).click();
    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
    const options_ = options(element);
    expect(options_.map((o) => o.dataset['value'])).toEqual(['en', 'de']);
    expect(options_[0].getAttribute('aria-selected')).toBe('true');
    expect(options_[1].getAttribute('aria-selected')).toBe('false');
  });

  it('emits lw-select-change and updates the value when an option is clicked', () => {
    const element = mount('en');
    const onChange = vi.fn();
    element.addEventListener(LW_SELECT_CHANGE, (e) =>
      onChange((e as CustomEvent).detail.value),
    );

    trigger(element).click();
    options(element)[1].click();

    expect(onChange).toHaveBeenCalledWith('de');
    expect(element.getAttribute('value')).toBe('de');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
    expect(trigger(element).textContent).toContain('Deutsch');
  });

  it('does NOT emit when the value is set programmatically (no feedback loop)', () => {
    const element = mount('en');
    const onChange = vi.fn();
    element.addEventListener(LW_SELECT_CHANGE, onChange);

    element.setAttribute('value', 'de');

    expect(onChange).not.toHaveBeenCalled();
    expect(trigger(element).textContent).toContain('Deutsch');
  });

  it('navigates with the keyboard: ArrowDown roves, Enter selects', () => {
    const element = mount('en');
    const onChange = vi.fn();
    element.addEventListener(LW_SELECT_CHANGE, (e) =>
      onChange((e as CustomEvent).detail.value),
    );

    trigger(element).click();
    const listbox = element.querySelector('[role="listbox"]')!;
    key(element, listbox, 'ArrowDown');
    key(element, listbox, 'Enter');

    expect(onChange).toHaveBeenCalledWith('de');
    expect(element.getAttribute('value')).toBe('de');
  });

  it('closes on Escape without changing the value', () => {
    const element = mount('en');
    trigger(element).click();
    key(element, element.querySelector('[role="listbox"]')!, 'Escape');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
    expect(element.getAttribute('value')).toBe('en');
  });

  it('opens from the trigger keyboard (Space) and a second trigger click closes it', () => {
    const element = mount('en');
    key(element, trigger(element), ' ');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
    trigger(element).click();
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('ArrowUp wraps to the last option', () => {
    const element = mount('en');
    trigger(element).click();
    key(element, element.querySelector('[role="listbox"]')!, 'ArrowUp');
    key(element, element.querySelector('[role="listbox"]')!, 'Enter');
    expect(element.getAttribute('value')).toBe('de');
  });

  it('Home and End move the active option to the first/last', () => {
    const element = mount('en');
    trigger(element).click();
    const listbox = element.querySelector('[role="listbox"]')!;
    key(element, listbox, 'End');
    expect(options(element)[1].classList.contains('is-active')).toBe(true);
    key(element, listbox, 'Home');
    expect(options(element)[0].classList.contains('is-active')).toBe(true);
  });

  it('typeahead jumps to the first option matching the typed prefix', () => {
    const element = mount('en');
    trigger(element).click();
    key(element, element.querySelector('[role="listbox"]')!, 'd');
    expect(options(element)[1].classList.contains('is-active')).toBe(true);
  });

  it('pointermove over an option makes it the active one', () => {
    const element = mount('en');
    trigger(element).click();
    options(element)[1].dispatchEvent(new Event('pointermove', { bubbles: true }));
    expect(options(element)[1].classList.contains('is-active')).toBe(true);
  });

  it('closes on Tab without changing the value', () => {
    const element = mount('en');
    trigger(element).click();
    key(element, element.querySelector('[role="listbox"]')!, 'Tab');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
    expect(element.getAttribute('value')).toBe('en');
  });

  it('closes when a pointerdown lands outside the element', () => {
    const element = mount('en');
    trigger(element).click();
    document.dispatchEvent(new Event('pointerdown'));
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('disables its trigger and does not open while the select is disabled', () => {
    const element = mount('en');
    element.setAttribute('disabled', '');

    expect(trigger(element).disabled).toBe(true);

    trigger(element).click();
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');

    element.removeAttribute('disabled');
    expect(trigger(element).disabled).toBe(false);
  });

  it('closes an open listbox when disabled at runtime', () => {
    const element = mount('en');
    trigger(element).click();
    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');

    element.setAttribute('disabled', '');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('does not commit a disabled option and skips it in typeahead', () => {
    const element = mount('en');
    const disabled = document.createElement(LW_OPTION_TAG);
    disabled.setAttribute('value', 'fr');
    disabled.setAttribute('disabled', '');
    disabled.textContent = 'Français';
    element.append(disabled);
    const onChange = vi.fn();
    element.addEventListener(LW_SELECT_CHANGE, onChange);

    trigger(element).click();
    options(element)[2].click();

    expect(onChange).not.toHaveBeenCalled();
    expect(element.getAttribute('value')).toBe('en');
  });
});
