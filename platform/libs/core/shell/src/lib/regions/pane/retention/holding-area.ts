import { moveNode } from './atomic-move';

export interface HiddenNode {
  readonly element: HTMLElement;
  readonly display: string;
}

export class HoldingArea {
  private element: HTMLElement | null = null;

  constructor(private readonly document: Document) {}

  moveInto(nodes: readonly Node[]): void {
    const area = this.connected();
    for (const node of nodes) {
      if (node.parentNode !== area) {
        moveNode(area, node, null);
      }
    }
  }

  remove(): void {
    this.element?.remove();
    this.element = null;
  }

  private connected(): HTMLElement {
    if (this.element?.isConnected) {
      return this.element;
    }
    const area = this.document.createElement('div');
    area.dataset['lwRetentionHold'] = '';
    area.style.display = 'none';
    this.document.body.append(area);
    this.element = area;
    return area;
  }
}

export function hideElements(
  elements: readonly HTMLElement[],
): readonly HiddenNode[] {
  return elements.map((element) => {
    const display = element.style.display;
    element.style.display = 'none';
    return { element, display };
  });
}

export function revealElements(hidden: readonly HiddenNode[]): void {
  for (const { element, display } of hidden) {
    element.style.display = display;
  }
}
