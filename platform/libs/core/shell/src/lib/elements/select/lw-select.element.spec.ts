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
    return control.getAttribute('aria-label') ?? '';
  }
  return ids
    .split(' ')
    .map((id) => {
      const part = document.querySelector(`#${id}`);
      return part ? announcedText(part).trim() : '';
    })
    .join(' ');
};
const announcedValue = (control: HTMLElement): string =>
  announcedText(control).trim();
const options = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLElement>('[role="option"]'),
];
const press = (
  target: Element,
  k: string,
  init: KeyboardEventInit = {},
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key: k,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};
const activeOption = (element: HTMLElement): HTMLElement | null => {
  const id = trigger(element).getAttribute('aria-activedescendant');
  return id === null ? null : element.querySelector<HTMLElement>(`#${id}`);
};
const value = (element: HTMLElement) => element.getAttribute('value');
function addOption(
  element: HTMLElement,
  optionValue: string,
  label: string,
  disabled = false,
): void {
  const option = document.createElement(LW_OPTION_TAG);
  option.setAttribute('value', optionValue);
  option.toggleAttribute('disabled', disabled);
  option.textContent = label;
  element.append(option);
}

describe('<lw-select> custom element', () => {
  beforeAll(() => defineLwSelect());
  afterEach(() => document.body.replaceChildren());

  it('registers both tags', () => {
    expect(customElements.get(LW_SELECT_TAG)).toBeDefined();
    expect(customElements.get(LW_OPTION_TAG)).toBeDefined();
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

  it('shows the selected value with its glyph, closed', () => {
    const element = mount('de');

    expect(visibleText(trigger(element))).toContain('Deutsch');
    expect(visibleText(trigger(element))).toContain('🇩🇪');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the placeholder when nothing is selected', () => {
    const element = mount();
    element.setAttribute('placeholder', 'Choose…');

    expect(visibleText(trigger(element))).toContain('Choose…');
  });

  it('opens a listbox of options with the current one marked selected', () => {
    const element = mount('en');

    trigger(element).click();

    expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
    expect(options(element).map((o) => o.dataset['value'])).toEqual([
      'en',
      'de',
    ]);
    expect(options(element)[0].getAttribute('aria-selected')).toBe('true');
    expect(options(element)[1].getAttribute('aria-selected')).toBe('false');
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
    expect(value(element)).toBe('de');
    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
    expect(visibleText(trigger(element))).toContain('Deutsch');
  });

  it('does NOT emit when the value is set programmatically (no feedback loop)', () => {
    const element = mount('en');
    const onChange = vi.fn();
    element.addEventListener(LW_SELECT_CHANGE, onChange);

    element.setAttribute('value', 'de');

    expect(onChange).not.toHaveBeenCalled();
    expect(visibleText(trigger(element))).toContain('Deutsch');
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

    element.setAttribute('disabled', '');

    expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
  });

  it('does not commit a disabled option', () => {
    const element = mount('en');
    addOption(element, 'fr', 'Français', true);
    const onChange = vi.fn();
    element.addEventListener(LW_SELECT_CHANGE, onChange);

    trigger(element).click();
    options(element)[2].click();

    expect(onChange).not.toHaveBeenCalled();
    expect(value(element)).toBe('en');
  });

  describe('name, value and state for assistive technology', () => {
    it('is a combobox that opens a listbox', () => {
      const element = mount('en');

      expect(trigger(element).getAttribute('role')).toBe('combobox');
      expect(trigger(element).getAttribute('aria-controls')).toBe(
        element.querySelector('[role="listbox"]')?.id,
      );
    });

    it('is named by its label alone and carries the choice as its value', () => {
      const element = mount('de');

      expect(accessibleName(trigger(element))).toBe('Language');
      expect(announcedValue(trigger(element))).toBe('Deutsch');
    });

    it('carries the choice as its value in the compact symbol form too', () => {
      const element = mount('de');
      element.setAttribute('compact', '');

      expect(visibleText(trigger(element))).toContain('🇩🇪');
      expect(visibleText(trigger(element))).not.toContain('Deutsch');
      expect(accessibleName(trigger(element))).toBe('Language');
      expect(announcedValue(trigger(element))).toBe('Deutsch');
    });

    it('carries the placeholder as its value while nothing is chosen', () => {
      const element = mount();
      element.setAttribute('placeholder', 'Choose…');

      expect(accessibleName(trigger(element))).toBe('Language');
      expect(announcedValue(trigger(element))).toBe('Choose…');
    });

    it('follows the choice when it changes', () => {
      const element = mount('en');

      element.setAttribute('value', 'de');

      expect(accessibleName(trigger(element))).toBe('Language');
      expect(announcedValue(trigger(element))).toBe('Deutsch');
    });

    it('takes a label of the consumer’s own by aria-labelledby, without the choice', () => {
      const label = document.createElement('span');
      label.id = 'own-label';
      label.textContent = 'Text language';
      document.body.append(label);
      const element = mount('en');
      element.removeAttribute('label');
      element.setAttribute('aria-labelledby', 'own-label');

      expect(accessibleName(trigger(element))).toBe('Text language');
      expect(trigger(element).hasAttribute('aria-label')).toBe(false);
    });

    it('takes an aria-label on the element in place of the label attribute', () => {
      const element = mount('en');
      element.removeAttribute('label');
      element.setAttribute('aria-label', 'Spoken language');

      expect(accessibleName(trigger(element))).toBe('Spoken language');
    });

    it('is nameless when nothing names it, and still shows its choice', () => {
      const element = mount('en');
      element.removeAttribute('label');

      expect(trigger(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(trigger(element).hasAttribute('aria-label')).toBe(false);
      expect(visibleText(trigger(element))).toContain('English');
    });

    it('keeps its label out of what the control reads as its value', () => {
      const element = mount('en');

      expect(trigger(element).textContent).not.toContain('Language');
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

    it('announces a required choice from the attribute, and follows its removal', () => {
      const element = mount('en');

      element.setAttribute('required', '');

      expect(trigger(element).getAttribute('aria-required')).toBe('true');
      expect(element.hasAttribute('aria-required')).toBe(false);

      element.removeAttribute('required');

      expect(trigger(element).hasAttribute('aria-required')).toBe(false);
    });

    it('takes required as a property and reflects it', () => {
      const element = mount('en') as HTMLElement & { required: boolean };

      element.required = true;

      expect(element.hasAttribute('required')).toBe(true);
      expect(trigger(element).getAttribute('aria-required')).toBe('true');

      element.required = false;

      expect(element.required).toBe(false);
      expect(trigger(element).hasAttribute('aria-required')).toBe(false);
    });

    it('keeps a required property set before the element was upgraded', () => {
      const element = document.createElement(
        'lw-select-late',
      ) as HTMLElement & {
        required: boolean;
      };
      element.required = true;
      document.body.append(element);
      class LateSelect extends (customElements.get(LW_SELECT_TAG) as {
        new (): HTMLElement;
      }) {}
      customElements.define('lw-select-late', LateSelect);

      expect(element.hasAttribute('required')).toBe(true);
      expect(trigger(element).getAttribute('aria-required')).toBe('true');
    });
  });

  describe('keyboard, with focus kept on the control', () => {
    it('opens from the keyboard and keeps focus on the trigger, pointing at the choice', () => {
      const element = mount('de');
      trigger(element).focus();

      const event = press(trigger(element), 'ArrowDown');

      expect(event.defaultPrevented).toBe(true);
      expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(trigger(element));
      expect(activeOption(element)?.dataset['value']).toBe('de');
      expect(options(element).every((o) => !o.hasAttribute('tabindex'))).toBe(
        true,
      );
    });

    it('moves the active option with the arrows while focus stays put, and Enter chooses it', () => {
      const element = mount('en');
      const onChange = vi.fn();
      element.addEventListener(LW_SELECT_CHANGE, (e) =>
        onChange((e as CustomEvent).detail.value),
      );
      trigger(element).focus();
      press(trigger(element), 'Enter');

      press(trigger(element), 'ArrowDown');

      expect(activeOption(element)?.dataset['value']).toBe('de');
      expect(activeOption(element)?.classList.contains('is-active')).toBe(true);
      expect(document.activeElement).toBe(trigger(element));

      const enter = press(trigger(element), 'Enter');

      expect(enter.defaultPrevented).toBe(true);
      expect(onChange).toHaveBeenCalledWith('de');
      expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
      expect(trigger(element).hasAttribute('aria-activedescendant')).toBe(
        false,
      );
      expect(document.activeElement).toBe(trigger(element));
    });

    it('chooses with Space and with Alt+ArrowUp', () => {
      const element = mount('en');
      press(trigger(element), ' ');
      press(trigger(element), 'ArrowDown');
      press(trigger(element), ' ');

      expect(value(element)).toBe('de');

      press(trigger(element), 'ArrowDown', { altKey: true });
      press(trigger(element), 'ArrowUp');
      press(trigger(element), 'ArrowUp', { altKey: true });

      expect(value(element)).toBe('en');
      expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
    });

    it('ArrowUp wraps to the last option', () => {
      const element = mount('en');
      trigger(element).click();

      press(trigger(element), 'ArrowUp');
      press(trigger(element), 'Enter');

      expect(value(element)).toBe('de');
    });

    it('Home and End move the active option to the first and last', () => {
      const element = mount('en');
      trigger(element).click();

      press(trigger(element), 'End');
      expect(activeOption(element)?.dataset['value']).toBe('de');

      press(trigger(element), 'Home');
      expect(activeOption(element)?.dataset['value']).toBe('en');
    });

    it('skips a disabled option when moving', () => {
      const element = mount('en');
      addOption(element, 'fr', 'Français', true);
      addOption(element, 'it', 'Italiano');
      trigger(element).click();

      press(trigger(element), 'ArrowDown');
      press(trigger(element), 'ArrowDown');
      expect(activeOption(element)?.dataset['value']).toBe('it');

      press(trigger(element), 'End');
      expect(activeOption(element)?.dataset['value']).toBe('it');
    });

    it('opens at the first and last option from Home and End on the closed control', () => {
      const element = mount('de');

      press(trigger(element), 'Home');
      expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
      expect(activeOption(element)?.dataset['value']).toBe('en');

      press(trigger(element), 'Escape');
      press(trigger(element), 'End');
      expect(activeOption(element)?.dataset['value']).toBe('de');
    });

    it('opens from Alt+ArrowDown on the closed control', () => {
      const element = mount('en');

      press(trigger(element), 'ArrowDown', { altKey: true });

      expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
    });

    it('opens at the first match when a letter is typed on the closed control', () => {
      const element = mount('en');

      const event = press(trigger(element), 'd');

      expect(event.defaultPrevented).toBe(true);
      expect(trigger(element).getAttribute('aria-expanded')).toBe('true');
      expect(activeOption(element)?.dataset['value']).toBe('de');
    });

    it('typeahead jumps to the first option matching the typed prefix and skips a disabled one', () => {
      const element = mount('en');
      addOption(element, 'da', 'Dansk', true);
      trigger(element).click();

      press(trigger(element), 'd');

      expect(activeOption(element)?.dataset['value']).toBe('de');
    });

    it('leaves a modified letter to the page', () => {
      const element = mount('en');

      const event = press(trigger(element), 'd', { metaKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Escape without changing the value and marks the key handled', () => {
      const element = mount('en');
      trigger(element).click();
      press(trigger(element), 'ArrowDown');

      const escape = press(trigger(element), 'Escape');

      expect(escape.defaultPrevented).toBe(true);
      expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
      expect(value(element)).toBe('en');
    });

    it('leaves Escape on the closed control to whatever is around it', () => {
      const element = mount('en');

      const escape = press(trigger(element), 'Escape');

      expect(escape.defaultPrevented).toBe(false);
    });

    it('closes on Tab without choosing, and lets focus move on', () => {
      const element = mount('en');
      trigger(element).click();
      press(trigger(element), 'ArrowDown');

      const tab = press(trigger(element), 'Tab');

      expect(tab.defaultPrevented).toBe(false);
      expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
      expect(value(element)).toBe('en');
    });

    it('a second trigger click closes the list', () => {
      const element = mount('en');
      press(trigger(element), ' ');

      trigger(element).click();

      expect(trigger(element).getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('pointer', () => {
    it('keeps focus on the trigger when an option is pressed', () => {
      const element = mount('en');
      trigger(element).click();
      const pointerDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });

      options(element)[1].dispatchEvent(pointerDown);

      expect(pointerDown.defaultPrevented).toBe(true);
    });

    it('pointermove over an option makes it the active one', () => {
      const element = mount('en');
      trigger(element).click();

      options(element)[1].dispatchEvent(
        new Event('pointermove', { bubbles: true }),
      );

      expect(activeOption(element)?.dataset['value']).toBe('de');
    });
  });
});
