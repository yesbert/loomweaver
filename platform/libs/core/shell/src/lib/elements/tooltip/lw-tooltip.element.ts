import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';

const DEFAULT_DELAY_MS = 600;

/** Tooltip placement relative to the trigger — the element positions the bubble in JS accordingly. */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

const TOOLTIP_GAP = 6;
const VIEWPORT_MARGIN = 4;

const CURSOR_OFFSET_X = 0;
const CURSOR_BELOW_Y = 16;
const CURSOR_ABOVE_GAP = 6;

/** The custom-element tag. Authored as the last child of a `position: relative` trigger. */
export const LW_TOOLTIP_TAG = 'lw-tooltip';

/**
 * `<lw-tooltip>` — the host tooltip primitive as a **framework-agnostic custom element**.
 * It is a plain `HTMLElement` (no framework runtime), so it crosses the Nx boundary as a *tag* (an
 * SDK-only weaver uses `<lw-tooltip text="…" position="bottom">` without importing `@loomweaver/shell`) and,
 * later, an iframe/sandbox boundary once the element script is served alongside `theme.css`.
 *
 * The element renders the bubble and drives it entirely in JS — reveal, hide, and **positioning**. The
 * bubble is a **Popover** in the browser top layer, so it is never clipped by a `transform`/`overflow`
 * ancestor (a virtual-scroll row) nor lost under a region's z-order (#13). Its `left`/`top` are computed
 * in JS (no CSS anchor positioning — shipping Safari does not support it): a **pointer** reveal anchors to
 * the **cursor** (native-`title`-like, so a wide trigger's tooltip appears where the mouse is, not at the
 * element's far edge); a **focus** reveal anchors to the trigger element per `position`. Reveal is off the
 * trigger's hover/focus (mouse only — touch never reveals). Its **look** lives in `theme.css`
 * (`.lw-tooltip-bubble`, tokened) like `.lw-btn`. Place it as the last child of a positioned trigger:
 *
 *   <button class="relative …" [attr.aria-label]="'key' | transloco">
 *     <lw-icon name="…" />
 *     <lw-tooltip text="…" position="bottom"></lw-tooltip>
 *   </button>
 */
export class LwTooltipElement extends HTMLElement {
  static readonly observedAttributes = [
    'text',
    'position',
    'delay-ms',
    'max-width',
  ];

  private bubble?: HTMLSpanElement;

  private trigger?: HTMLElement;

  private showTimer?: ReturnType<typeof setTimeout>;

  private pointer?: { x: number; y: number };

  get text(): string | null {
    return this.getAttribute('text');
  }

  set text(value: string | null) {
    reflectAttribute(this, 'text', value);
  }

  get position(): TooltipPosition {
    return (this.getAttribute('position') as TooltipPosition | null) ?? 'top';
  }

  set position(value: TooltipPosition | null) {
    reflectAttribute(this, 'position', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'text');
    upgradeElementProperty(this, 'position');
    this.render();

    this.trigger = this.parentElement ?? undefined;
    this.trigger?.addEventListener('pointerenter', this.onEnter);
    this.trigger?.addEventListener('pointermove', this.onMove);
    this.trigger?.addEventListener('pointerleave', this.onLeave);
    this.trigger?.addEventListener('focusin', this.onFocusIn);
    this.trigger?.addEventListener('focusout', this.onFocusOut);
  }

  disconnectedCallback(): void {
    this.hide();
    this.trigger?.removeEventListener('pointerenter', this.onEnter);
    this.trigger?.removeEventListener('pointermove', this.onMove);
    this.trigger?.removeEventListener('pointerleave', this.onLeave);
    this.trigger?.removeEventListener('focusin', this.onFocusIn);
    this.trigger?.removeEventListener('focusout', this.onFocusOut);
    this.trigger = undefined;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private readonly onEnter = (event: PointerEvent) => this.scheduleShow(event);

  private readonly onMove = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') {
      this.pointer = { x: event.clientX, y: event.clientY };
    }
  };

  private readonly onLeave = () => this.hide();

  private readonly onFocusIn = () => this.scheduleShow();

  private readonly onFocusOut = () => this.hide();

  private render(): void {
    const text = (this.getAttribute('text') ?? '').trim();
    if (!text) {
      this.bubble?.remove();
      this.bubble = undefined;
      return;
    }
    const bubble = this.bubble ?? this.createBubble();
    bubble.textContent = text;
    bubble.style.maxWidth = this.getAttribute('max-width') ?? '16rem';
  }

  private createBubble(): HTMLSpanElement {
    const bubble = document.createElement('span');
    bubble.className = 'lw-tooltip-bubble';
    bubble.setAttribute('role', 'tooltip');

    bubble.setAttribute('popover', 'manual');
    this.append(bubble);
    this.bubble = bubble;
    return bubble;
  }

  private scheduleShow(event?: PointerEvent): void {
    if (event && event.pointerType !== 'mouse') {
      return;
    }

    this.pointer = event ? { x: event.clientX, y: event.clientY } : undefined;
    this.clearTimer();
    this.showTimer = setTimeout(() => this.show(), this.delayMs());
  }

  private delayMs(): number {
    const raw = this.getAttribute('delay-ms');
    if (raw === null || raw.trim() === '') {
      return DEFAULT_DELAY_MS;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DELAY_MS;
  }

  private show(): void {
    const bubble = this.bubble;
    if (!bubble?.isConnected || typeof bubble.showPopover !== 'function') {
      return;
    }
    try {
      bubble.showPopover();
    } catch {
      return;
    }
    this.placeBubble(bubble);
  }

  private placeBubble(bubble: HTMLElement): void {
    const b = bubble.getBoundingClientRect();
    let left: number;
    let top: number;
    if (this.pointer) {
      left = this.pointer.x + CURSOR_OFFSET_X;
      const below = this.pointer.y + CURSOR_BELOW_Y;
      top =
        below + b.height + VIEWPORT_MARGIN > window.innerHeight
          ? this.pointer.y - b.height - CURSOR_ABOVE_GAP
          : below;
    } else if (this.trigger) {
      const t = this.trigger.getBoundingClientRect();
      const centerX = t.left + t.width / 2 - b.width / 2;
      const centerY = t.top + t.height / 2 - b.height / 2;
      switch (this.position) {
        case 'bottom': {
          [left, top] = [centerX, t.bottom + TOOLTIP_GAP];
          break;
        }
        case 'left': {
          [left, top] = [t.left - b.width - TOOLTIP_GAP, centerY];
          break;
        }
        case 'right': {
          [left, top] = [t.right + TOOLTIP_GAP, centerY];
          break;
        }
        default: {
          [left, top] = [centerX, t.top - b.height - TOOLTIP_GAP];
        }
      }
    } else {
      return;
    }
    const maxLeft = window.innerWidth - b.width - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - b.height - VIEWPORT_MARGIN;
    bubble.style.left = `${Math.round(Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft)))}px`;
    bubble.style.top = `${Math.round(Math.max(VIEWPORT_MARGIN, Math.min(top, maxTop)))}px`;
  }

  private hide(): void {
    this.clearTimer();
    const bubble = this.bubble;
    if (!bubble || typeof bubble.hidePopover !== 'function') {
      return;
    }
    try {
      bubble.hidePopover();
    } catch {
      return;
    }
  }

  private clearTimer(): void {
    if (this.showTimer === undefined) {
      return;
    }

    clearTimeout(this.showTimer);
    this.showTimer = undefined;
  }
}

/** Registers `<lw-tooltip>` once (idempotent) — called from {@link provideShell} at bootstrap. */
export function defineLwTooltip(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get(LW_TOOLTIP_TAG)
  ) {
    customElements.define(LW_TOOLTIP_TAG, LwTooltipElement);
  }
}
