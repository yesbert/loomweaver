import {
  LW_PROGRESS_RING_TAG,
  defineLwProgressRing,
} from './lw-progress-ring.element';

function mount(attrs: Record<string, string>): HTMLElement {
  const el = document.createElement(LW_PROGRESS_RING_TAG);
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, value);
  }
  document.body.append(el);
  return el;
}

describe('<lw-progress-ring> custom element', () => {
  beforeAll(() => defineLwProgressRing());
  afterEach(() => document.body.replaceChildren());

  it('registers the tag', () => {
    expect(customElements.get(LW_PROGRESS_RING_TAG)).toBeDefined();
  });

  it('exposes progressbar semantics from value/max', () => {
    const ring = mount({ value: '60', max: '100' });
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.getAttribute('aria-valuenow')).toBe('60');
    expect(ring.getAttribute('aria-valuemin')).toBe('0');
    expect(ring.getAttribute('aria-valuemax')).toBe('100');
    expect(
      ring
        .querySelector('.lw-progress-ring-value')
        ?.getAttribute('stroke-dashoffset'),
    ).toBe('40');
    expect(ring.querySelector('.lw-progress-ring-text')?.textContent).toBe(
      '60%',
    );
  });

  it('clamps the value into [0, max] and rounds the percentage', () => {
    const over = mount({ value: '999', max: '200' });
    expect(over.getAttribute('aria-valuenow')).toBe('200');
    expect(over.querySelector('.lw-progress-ring-text')?.textContent).toBe(
      '100%',
    );

    const third = mount({ value: '1', max: '3' });
    expect(third.querySelector('.lw-progress-ring-text')?.textContent).toBe(
      '33%',
    );
    expect(
      third
        .querySelector('.lw-progress-ring-value')
        ?.getAttribute('stroke-dashoffset'),
    ).toBe('67');
  });

  it('defaults max to 100 when the attribute is absent (not 0)', () => {
    const ring = mount({ value: '72' });
    expect(ring.getAttribute('aria-valuemax')).toBe('100');
    expect(ring.getAttribute('aria-valuenow')).toBe('72');
    expect(ring.querySelector('.lw-progress-ring-text')?.textContent).toBe(
      '72%',
    );
  });

  it('reacts to attribute changes', () => {
    const ring = mount({ value: '10', max: '100' });
    ring.setAttribute('value', '90');
    expect(ring.getAttribute('aria-valuenow')).toBe('90');
    expect(ring.querySelector('.lw-progress-ring-text')?.textContent).toBe(
      '90%',
    );
  });
});
