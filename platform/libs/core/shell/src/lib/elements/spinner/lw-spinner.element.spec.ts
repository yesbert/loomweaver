import { LW_SPINNER_TAG, defineLwSpinner } from './lw-spinner.element';

interface Spinner extends HTMLElement {
  size: string;
  label: string;
}

function ringOf(spinner: HTMLElement): HTMLElement {
  return spinner.querySelector('.lw-spinner-ring') as HTMLElement;
}

describe('<lw-spinner> custom element', () => {
  afterEach(() => document.body.replaceChildren());

  it('takes a size and a label set as properties before it is defined', () => {
    const early = document.createElement(LW_SPINNER_TAG) as Spinner;
    early.size = '3rem';
    early.label = 'Saving';
    document.body.append(early);

    defineLwSpinner();

    expect(customElements.get(LW_SPINNER_TAG)).toBeDefined();
    expect(ringOf(early).style.width).toBe('3rem');
    expect(ringOf(early).getAttribute('aria-label')).toBe('Saving');
  });

  it('draws a status ring of the given size and name from attributes', () => {
    defineLwSpinner();
    document.body.innerHTML = '<lw-spinner size="1rem" label="Loading"></lw-spinner>';

    const ring = ringOf(document.body.firstElementChild as HTMLElement);

    expect(ring.getAttribute('role')).toBe('status');
    expect(ring.getAttribute('aria-label')).toBe('Loading');
    expect(ring.style.width).toBe('1rem');
    expect(ring.style.height).toBe('1rem');
  });

  it('defaults to 1.5rem and carries no name without a label', () => {
    defineLwSpinner();
    document.body.innerHTML = '<lw-spinner></lw-spinner>';

    const ring = ringOf(document.body.firstElementChild as HTMLElement);

    expect(ring.style.width).toBe('1.5rem');
    expect(ring.hasAttribute('aria-label')).toBe(false);
  });

  it('follows a size and a label changed while it is on screen', () => {
    defineLwSpinner();
    const spinner = document.createElement(LW_SPINNER_TAG) as Spinner;
    document.body.append(spinner);

    spinner.setAttribute('size', '2rem');
    spinner.label = 'Still working';

    expect(ringOf(spinner).style.width).toBe('2rem');
    expect(ringOf(spinner).getAttribute('aria-label')).toBe('Still working');

    spinner.label = '';
    expect(ringOf(spinner).hasAttribute('aria-label')).toBe(false);
  });

  it('draws one ring however often it is attached', () => {
    defineLwSpinner();
    const spinner = document.createElement(LW_SPINNER_TAG);
    document.body.append(spinner);
    spinner.remove();
    document.body.append(spinner);

    expect(spinner.querySelectorAll('.lw-spinner-ring')).toHaveLength(1);
  });
});
