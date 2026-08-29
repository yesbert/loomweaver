import {
  reflectAttribute,
  upgradeElementProperty,
} from './custom-element-property';

describe('upgradeElementProperty', () => {
  it('re-applies an own property through the element setter', () => {
    const element = document.createElement('div');
    let seen: unknown;
    Object.defineProperty(Object.getPrototypeOf(element), 'value', {
      configurable: true,
      set(next: unknown) {
        seen = next;
      },
      get() {
        return seen;
      },
    });
    (element as unknown as Record<string, unknown>)['value'] = 'hi';

    upgradeElementProperty(element, 'value');

    expect(seen).toBe('hi');
    expect(
      Object.prototype.hasOwnProperty.call(element, 'value'),
    ).toBe(false);
    delete (Object.getPrototypeOf(element) as Record<string, unknown>)['value'];
  });

  it('does nothing when the property is not set as an own property', () => {
    const element = document.createElement('div');
    expect(() => upgradeElementProperty(element, 'missing')).not.toThrow();
  });
});

describe('reflectAttribute', () => {
  it('sets the attribute for a string value', () => {
    const element = document.createElement('div');
    reflectAttribute(element, 'aria-label', 'hello');
    expect(element.getAttribute('aria-label')).toBe('hello');
  });

  it('removes the attribute for null or undefined', () => {
    const element = document.createElement('div');
    element.setAttribute('aria-label', 'hello');
    reflectAttribute(element, 'aria-label', null);
    expect(element.hasAttribute('aria-label')).toBe(false);

    element.setAttribute('aria-label', 'hello');
    reflectAttribute(element, 'aria-label', undefined);
    expect(element.hasAttribute('aria-label')).toBe(false);
  });
});
