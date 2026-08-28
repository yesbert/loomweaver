import {
  reflectAttribute,
  upgradeElementProperty,
} from './custom-element-property';

describe('upgradeElementProperty', () => {
  it('re-applies an own property through the element setter', () => {
    const el = document.createElement('div');
    let seen: unknown;
    Object.defineProperty(Object.getPrototypeOf(el), 'value', {
      configurable: true,
      set(next: unknown) {
        seen = next;
      },
      get() {
        return seen;
      },
    });
    (el as unknown as Record<string, unknown>)['value'] = 'hi';

    upgradeElementProperty(el, 'value');

    expect(seen).toBe('hi');
    expect(
      Object.prototype.hasOwnProperty.call(el, 'value'),
    ).toBe(false);
    delete (Object.getPrototypeOf(el) as Record<string, unknown>)['value'];
  });

  it('does nothing when the property is not set as an own property', () => {
    const el = document.createElement('div');
    expect(() => upgradeElementProperty(el, 'missing')).not.toThrow();
  });
});

describe('reflectAttribute', () => {
  it('sets the attribute for a string value', () => {
    const el = document.createElement('div');
    reflectAttribute(el, 'aria-label', 'hello');
    expect(el.getAttribute('aria-label')).toBe('hello');
  });

  it('removes the attribute for null or undefined', () => {
    const el = document.createElement('div');
    el.setAttribute('aria-label', 'hello');
    reflectAttribute(el, 'aria-label', null);
    expect(el.hasAttribute('aria-label')).toBe(false);

    el.setAttribute('aria-label', 'hello');
    reflectAttribute(el, 'aria-label', undefined);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });
});
