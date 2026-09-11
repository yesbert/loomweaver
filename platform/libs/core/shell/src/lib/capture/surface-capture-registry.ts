import { DOCUMENT, inject, Service } from '@angular/core';
import { SurfaceCapture, SurfaceDrawing } from './surface-capture';

export interface CapturableSurface {
  readonly element: Element;
  captureSelf(drawing: SurfaceDrawing): Promise<SurfaceCapture | undefined>;
}

@Service()
export class SurfaceCaptureRegistry {
  private readonly document = inject(DOCUMENT);

  private readonly mounted = new Set<CapturableSurface>();

  register(surface: CapturableSurface): () => void {
    this.mounted.add(surface);
    return () => {
      this.mounted.delete(surface);
    };
  }

  visible(): readonly CapturableSurface[] {
    const view = this.document.defaultView;
    if (!view) {
      return [];
    }
    return [...this.mounted].filter(
      (surface) =>
        surface.element.isConnected &&
        surface.element.ownerDocument === this.document &&
        isOnScreen(surface.element, view),
    );
  }
}

function isOnScreen(element: Element, view: Window): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < view.innerHeight &&
    rect.left < view.innerWidth
  );
}
