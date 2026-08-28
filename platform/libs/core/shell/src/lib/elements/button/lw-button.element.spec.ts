import { defineLwButton, LW_BUTTON_TAG } from './lw-button.element';

function mount(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement(LW_BUTTON_TAG);
  el.textContent = 'Save';
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, value);
  }
  document.body.append(el);
  return el;
}

const press = (el: HTMLElement, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

describe('<lw-button> custom element', () => {
  beforeAll(() => defineLwButton());
  afterEach(() => document.body.replaceChildren());

  it('is registered and behaves as a role=button', () => {
    const el = mount();
    expect(customElements.get(LW_BUTTON_TAG)).toBeDefined();
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
  });

  it('emits the .lw-btn class contract from variant/size/icon-only', () => {
    const el = mount({ variant: 'primary', size: 'sm', 'icon-only': '' });
    expect(el.classList.contains('lw-btn')).toBe(true);
    expect(el.classList.contains('lw-btn--primary')).toBe(true);
    expect(el.classList.contains('lw-btn--sm')).toBe(true);
    expect(el.classList.contains('lw-btn--icon')).toBe(true);
  });

  it('defaults to the default variant + md size (no size modifier)', () => {
    const el = mount();
    expect(el.classList.contains('lw-btn--default')).toBe(true);
    expect(el.classList.contains('lw-btn--sm')).toBe(false);
  });

  it('preserves author classes and swaps variant on change', () => {
    const el = mount({ variant: 'primary', class: 'mt-2' });
    el.setAttribute('variant', 'danger');
    expect(el.classList.contains('lw-btn--danger')).toBe(true);
    expect(el.classList.contains('lw-btn--primary')).toBe(false);
    expect(el.classList.contains('mt-2')).toBe(true);
  });

  it('activates on Enter and Space', () => {
    const el = mount();
    const onClick = vi.fn();
    el.addEventListener('click', onClick);
    press(el, 'Enter');
    press(el, ' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('upgrades a property shadowed before the accessors existed (icon-only)', () => {
    const el = document.createElement(LW_BUTTON_TAG);
    Reflect.defineProperty(el, 'iconOnly', {
      value: true,
      configurable: true,
      writable: true,
      enumerable: true,
    });

    document.body.append(el);

    expect(el.hasAttribute('icon-only')).toBe(true);
    expect(el.classList.contains('lw-btn--icon')).toBe(true);
  });

  it('is not focusable or keyboard-activatable when disabled', () => {
    const el = mount({ disabled: '' });
    const onClick = vi.fn();
    el.addEventListener('click', onClick);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.tabIndex).toBe(-1);
    press(el, 'Enter');
    expect(onClick).not.toHaveBeenCalled();
  });
});
