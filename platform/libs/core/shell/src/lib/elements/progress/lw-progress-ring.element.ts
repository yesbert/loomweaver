export const LW_PROGRESS_RING_TAG = 'lw-progress-ring';

const RADIUS = 15.9155;

export class LwProgressRingElement extends HTMLElement {
  static readonly observedAttributes = ['value', 'max', 'size'];

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private num(name: string, fallback: number): number {
    const raw = this.getAttribute(name);
    if (raw === null || raw.trim() === '') {
      return fallback;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private render(): void {
    const max = Math.max(this.num('max', 100), 1);
    const value = Math.min(Math.max(this.num('value', 0), 0), max);
    const percent = Math.round((value / max) * 100);
    const size = this.getAttribute('size') ?? '2.5rem';

    this.style.width = size;
    this.style.height = size;
    this.setAttribute('role', 'progressbar');
    this.setAttribute('aria-valuenow', String(value));
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(max));

    this.innerHTML =
      `<svg class="lw-progress-ring-svg" viewBox="0 0 36 36" aria-hidden="true">` +
      `<circle class="lw-progress-ring-track" cx="18" cy="18" r="${RADIUS}"></circle>` +
      `<circle class="lw-progress-ring-value" cx="18" cy="18" r="${RADIUS}" transform="rotate(-90 18 18)"` +
      ` stroke-dasharray="100" stroke-dashoffset="${100 - percent}"></circle>` +
      `<text class="lw-progress-ring-text" x="18" y="18">${percent}%</text>` +
      `</svg>`;
  }
}

export function defineLwProgressRing(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get(LW_PROGRESS_RING_TAG)
  ) {
    customElements.define(LW_PROGRESS_RING_TAG, LwProgressRingElement);
  }
}
