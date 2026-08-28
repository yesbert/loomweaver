import DOMPurify from 'dompurify';
import { marked } from 'marked';
import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';

/** The custom-element tag. */
export const LW_MARKDOWN_TAG = 'lw-markdown';

/**
 * `<lw-markdown source="…">` — the host rich-text primitive as a framework-agnostic custom element
 * (like `<lw-tooltip>`/`<lw-select>`/`<lw-menu>`): a plain `HTMLElement`, **light DOM**, so the
 * `prose-lw` Tailwind-Typography classes + `--lw-*` tokens cascade in (auto dark-mode). It does
 * no formatting logic of its own — `marked` parses, **DOMPurify** sanitizes (scripts / `on*` / `javascript:`
 * stripped; the element renders raw `innerHTML`, so this is the security seam, like the icon registry).
 * Reusable anywhere rich text is needed (dialog bodies, About, weaver content), and — unlike the old
 * Angular component — usable in a weaver body by tag, no `@loomweaver/shell` import.
 *
 *   <lw-markdown [source]="'Delete **' + name + '**? This cannot be undone.'"></lw-markdown>
 */
export class LwMarkdownElement extends HTMLElement {
  static readonly observedAttributes = ['source'];

  private prose?: HTMLElement;

  get source(): string {
    return this.getAttribute('source') ?? '';
  }
  set source(value: string | null) {
    reflectAttribute(this, 'source', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'source');
    if (!this.prose) {
      this.prose = document.createElement('div');
      this.prose.className = 'prose prose-sm max-w-none prose-lw';
      this.append(this.prose);
    }
    this.render(this.prose);
  }

  attributeChangedCallback(): void {
    if (this.prose) {
      this.render(this.prose);
    }
  }

  private render(prose: HTMLElement): void {
    const html = marked.parse(this.source, {
      async: false,
      gfm: true,
      breaks: true,
    });

    prose.innerHTML = DOMPurify.sanitize(html);
  }
}

/** Registers `<lw-markdown>` once (idempotent) — called from {@link provideShell} at bootstrap. */
export function defineLwMarkdown(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get(LW_MARKDOWN_TAG)
  ) {
    customElements.define(LW_MARKDOWN_TAG, LwMarkdownElement);
  }
}
