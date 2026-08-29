import { defineLwButton, LW_BUTTON_TAG } from './lw-button.element';

function mount(attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(LW_BUTTON_TAG);
  element.textContent = 'Save';
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
}

const press = (element: HTMLElement, key: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

describe('<lw-button> custom element', () => {
  beforeAll(() => defineLwButton());
  afterEach(() => document.body.replaceChildren());

  it('is registered and behaves as a role=button', () => {
    const element = mount();
    expect(customElements.get(LW_BUTTON_TAG)).toBeDefined();
    expect(element.getAttribute('role')).toBe('button');
    expect(element.tabIndex).toBe(0);
  });

  it('emits the .lw-btn class contract from variant/size/icon-only', () => {
    const element = mount({ variant: 'primary', size: 'sm', 'icon-only': '' });
    expect(element.classList.contains('lw-btn')).toBe(true);
    expect(element.classList.contains('lw-btn--primary')).toBe(true);
    expect(element.classList.contains('lw-btn--sm')).toBe(true);
    expect(element.classList.contains('lw-btn--icon')).toBe(true);
  });

  it('defaults to the default variant + md size (no size modifier)', () => {
    const element = mount();
    expect(element.classList.contains('lw-btn--default')).toBe(true);
    expect(element.classList.contains('lw-btn--sm')).toBe(false);
  });

  it('preserves author classes and swaps variant on change', () => {
    const element = mount({ variant: 'primary', class: 'mt-2' });
    element.setAttribute('variant', 'danger');
    expect(element.classList.contains('lw-btn--danger')).toBe(true);
    expect(element.classList.contains('lw-btn--primary')).toBe(false);
    expect(element.classList.contains('mt-2')).toBe(true);
  });

  it('activates on Enter and Space', () => {
    const element = mount();
    const onClick = vi.fn();
    element.addEventListener('click', onClick);
    press(element, 'Enter');
    press(element, ' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('upgrades a property shadowed before the accessors existed (icon-only)', () => {
    const element = document.createElement(LW_BUTTON_TAG);
    Reflect.defineProperty(element, 'iconOnly', {
      value: true,
      configurable: true,
      writable: true,
      enumerable: true,
    });

    document.body.append(element);

    expect(element.hasAttribute('icon-only')).toBe(true);
    expect(element.classList.contains('lw-btn--icon')).toBe(true);
  });

  it('is not focusable or keyboard-activatable when disabled', () => {
    const element = mount({ disabled: '' });
    const onClick = vi.fn();
    element.addEventListener('click', onClick);
    expect(element.getAttribute('aria-disabled')).toBe('true');
    expect(element.tabIndex).toBe(-1);
    press(element, 'Enter');
    expect(onClick).not.toHaveBeenCalled();
  });
});
