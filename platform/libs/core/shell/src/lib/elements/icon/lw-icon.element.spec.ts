import { defineLwIcon, LW_ICON_TAG } from './lw-icon.element';

function mount(attributes: Record<string, string>): HTMLElement {
  const element = document.createElement(LW_ICON_TAG);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
}

describe('<lw-icon> custom element', () => {
  beforeAll(() => defineLwIcon());
  afterEach(() => document.body.replaceChildren());

  it('is registered as a custom element', () => {
    expect(customElements.get(LW_ICON_TAG)).toBeDefined();
  });

  it('resolves a first-party name to its SVG and applies the size', () => {
    const element = mount({ name: 'close', size: '1rem' });
    const svg = element.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('1rem');
    expect(svg?.getAttribute('height')).toBe('1rem');
  });

  it('renders nothing for an unknown name (safe fallback)', () => {
    expect(mount({ name: 'does.not.exist' }).querySelector('svg')).toBeNull();
  });

  it('is decorative by default, and an image when given an aria-label', () => {
    expect(mount({ name: 'close' }).getAttribute('aria-hidden')).toBe('true');
    const labelled = mount({ name: 'close', 'aria-label': 'Close' });
    expect(labelled.getAttribute('role')).toBe('img');
    expect(labelled.getAttribute('aria-hidden')).toBeNull();
  });

  it('re-renders when the name changes', () => {
    const element = mount({ name: 'close' });
    element.setAttribute('name', 'search');
    expect(element.querySelector('svg')).not.toBeNull();
  });
});
