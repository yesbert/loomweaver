import { removeIcon, setIcon } from '../icon/icon-registry';
import { LW_OPTION_TAG } from './lw-option.element';
import {
  defineLwSelect,
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
function textOf(node: Node, skip: (element: HTMLElement) => boolean): string {
  if (!(node instanceof HTMLElement)) {
    return node.textContent ?? '';
  }
  if (skip(node)) {
    return '';
  }
  return [...node.childNodes].map((child) => textOf(child, skip)).join('');
}
const visibleText = (element: Element): string =>
  textOf(element, (node) => node.classList.contains('lw-select-hidden'));
const announcedText = (node: Node): string =>
  textOf(node, (element) => element.getAttribute('aria-hidden') === 'true');
const accessibleName = (control: HTMLElement): string => {
  const ids = control.getAttribute('aria-labelledby');
  if (ids === null) {
    return control.getAttribute('aria-label') ?? announcedText(control);
  }
  return ids
    .split(' ')
    .map((id) => {
      const part = document.querySelector(`#${id}`);
      return part ? announcedText(part).trim() : '';
    })
    .join(' ');
};
const options = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLElement>('[role="option"]'),
];
const key = (element: HTMLElement, target: Element, k: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('<lw-select> custom element', () => {
  beforeAll(() => defineLwSelect());
  afterEach(() => document.body.replaceChildren());

  it('compact shows the chosen option by its icon alone and names it for assistive technology', () => {
    const element = mount('de');
    element.setAttribute('compact', '');

    expect(visibleText(trigger(element))).toContain('🇩🇪');
    expect(visibleText(trigger(element))).not.toContain('Deutsch');
    expect(accessibleName(trigger(element))).toBe('Language Deutsch');

    element.removeAttribute('compact');

    expect(visibleText(trigger(element))).toContain('Deutsch');
    expect(accessibleName(trigger(element))).toBe('Language Deutsch');
  });

  it('draws an option icon the registry knows, on the trigger and in the list', () => {
    setIcon(
      'sample-glyph',
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>',
    );
    const select = document.createElement(LW_SELECT_TAG);
    select.setAttribute('label', 'Layout');
    select.setAttribute('value', 'grid');
    const option = document.createElement(LW_OPTION_TAG);
    option.setAttribute('value', 'grid');
    option.setAttribute('icon', 'sample-glyph');
    option.textContent = 'Grid';
    select.append(option);
    document.body.append(select);

    trigger(select).click();

    for (const place of [trigger(select), options(select)[0]]) {
      expect(place.querySelector('lw-icon')?.getAttribute('name')).toBe(
        'sample-glyph',
      );
      expect(place.textContent).not.toContain('sample-glyph');
    }
    removeIcon('sample-glyph');
  });

  it('shows an option icon the registry does not know as written, like a flag', () => {
    const element = mount('de');

    trigger(element).click();

    expect(trigger(element).querySelector('lw-icon')).toBeNull();
    expect(trigger(element).textContent).toContain('🇩🇪');
    expect(options(element)[0].textContent).toContain('🇬🇧');
  });

  it('registers both tags', () => {
    expect(customElements.get(LW_SELECT_TAG)).toBeDefined();
    expect(customElements.get(LW_OPTION_TAG)).toBeDefined();
  });

  it('shows the selected value (glyph + label) and names the trigger by label and choice', () => {
    const element = mount('de');
    expect(trigger(element).textContent).toContain('Deutsch');
    expect(trigger(element).textContent).toContain('🇩🇪');
    expect(accessibleName(trigger(element))).toBe('Language Deutsch');
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

  it('marks its Escape as handled, so a dialog around it stays open', () => {
    const element = mount('en');
    trigger(element).click();
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    element.querySelector('[role="listbox"]')!.dispatchEvent(escape);

    expect(escape.defaultPrevented).toBe(true);
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
    options(element)[1].dispatchEvent(
      new Event('pointermove', { bubbles: true }),
    );
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

  describe('name, value and state for assistive technology', () => {
    it('names the trigger by the label and the placeholder while nothing is chosen', () => {
      const element = mount();
      element.setAttribute('placeholder', 'Choose…');

      expect(accessibleName(trigger(element))).toBe('Language Choose…');
    });

    it('follows the choice when it changes', () => {
      const element = mount('en');
      expect(accessibleName(trigger(element))).toBe('Language English');

      element.setAttribute('value', 'de');

      expect(accessibleName(trigger(element))).toBe('Language Deutsch');
    });

    it('takes a label of the consumer’s own by aria-labelledby, together with the choice', () => {
      const label = document.createElement('span');
      label.id = 'own-label';
      label.textContent = 'Text language';
      document.body.append(label);
      const element = mount('en');
      element.removeAttribute('label');
      element.setAttribute('aria-labelledby', 'own-label');

      expect(accessibleName(trigger(element))).toBe('Text language English');
      expect(trigger(element).hasAttribute('aria-label')).toBe(false);
    });

    it('takes an aria-label on the element in place of the label attribute', () => {
      const element = mount('en');
      element.removeAttribute('label');
      element.setAttribute('aria-label', 'Spoken language');

      expect(accessibleName(trigger(element))).toBe('Spoken language English');
    });

    it('is named by its choice alone when nothing names it', () => {
      const element = mount('en');
      element.removeAttribute('label');

      expect(trigger(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(visibleText(trigger(element))).toContain('English');
    });

    it('forwards invalid and a description to the trigger, and follows their removal', () => {
      const element = mount('en');
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', 'phone-error');

      expect(trigger(element).getAttribute('aria-invalid')).toBe('true');
      expect(trigger(element).getAttribute('aria-describedby')).toBe(
        'phone-error',
      );

      element.removeAttribute('aria-invalid');
      element.removeAttribute('aria-describedby');

      expect(trigger(element).hasAttribute('aria-invalid')).toBe(false);
      expect(trigger(element).hasAttribute('aria-describedby')).toBe(false);
    });
  });
});
