import { DOCUMENT, inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  CapturableSurface,
  SurfaceCaptureRegistry,
} from './surface-capture-registry';
import { captureScale, placeSurface } from './picture-assembly';
import { decodeDrawing } from './decode-drawing';

/** A drawing of the workbench, made without asking the browser for permission. */
export interface WorkbenchPicture {
  /** The drawing, as a `data:` URL, ready to show, annotate or attach to a report. */
  readonly image: string;
  readonly width: number;
  readonly height: number;
  /**
   * How many surfaces are on the picture as a statement that their content is absent rather than as
   * their content — a surface that failed to draw, or one that withheld itself.
   */
  readonly surfacesAbsent: number;
}

interface Placement {
  readonly surface: CapturableSurface;
  readonly rect: DOMRect;
}

interface Renderer {
  toCanvas(
    target: Element,
    options: { readonly scale: number },
  ): Promise<HTMLCanvasElement>;
}

/**
 * Draws the workbench as the user is seeing it, plugin surfaces included.
 *
 * The browser will not photograph the screen without a permission prompt and a surface picker, so
 * the picture is rendered from the document instead. That stops at an isolated surface, whose
 * content nothing outside it may read, so each one is asked to draw itself and its answer is placed
 * where it sits. A surface that cannot answer is drawn as a statement that its content is absent,
 * never as a blank — a blank in a picture attached to a fault report reads as evidence.
 *
 * What the user cannot see is not in the picture: content scrolled out of sight within a region
 * stays out, and a surface opened in its own window is not part of it.
 *
 * This is a distribution's to call. A plugin is offered no path to it, because a picture holds what
 * every other surface on screen is showing.
 */
@Service()
export class WorkbenchCaptureService {
  private readonly document = inject(DOCUMENT);

  private readonly surfaces = inject(SurfaceCaptureRegistry);

  private readonly transloco = inject(TranslocoService);

  private renderer?: Promise<Renderer>;

  async capture(): Promise<WorkbenchPicture> {
    const view = this.window();
    const renderer = await this.load();
    const scale = captureScale(view.devicePixelRatio);
    const root = this.document.body;

    const placements = this.placements();
    const [drawings, canvas] = await Promise.all([
      this.drawSurfaces(placements, scale, view),
      renderer.toCanvas(root, { scale }),
    ]);

    return this.assemble(canvas, root, placements, drawings, scale);
  }

  private window(): Window {
    const view = this.document.defaultView;
    if (!view) {
      throw new Error('the workbench has no window to draw');
    }
    return view;
  }

  private placements(): readonly Placement[] {
    return this.surfaces
      .visible()
      .map((surface) => ({ surface, rect: surface.element.getBoundingClientRect() }));
  }

  private async drawSurfaces(
    placements: readonly Placement[],
    scale: number,
    view: Window,
  ): Promise<readonly (CanvasImageSource | undefined)[]> {
    const answered = await Promise.all(
      placements.map((placement) => placement.surface.captureSelf(scale)),
    );
    return Promise.all(answered.map((drawing) => decodeDrawing(drawing, view)));
  }

  private assemble(
    canvas: HTMLCanvasElement,
    root: Element,
    placements: readonly Placement[],
    drawings: readonly (CanvasImageSource | undefined)[],
    scale: number,
  ): WorkbenchPicture {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('the workbench drawing has no surface to place onto');
    }
    const origin = root.getBoundingClientRect();
    const labels = { absent: this.transloco.translate('capture.surfaceAbsent') };

    for (const [index, placement] of placements.entries()) {
      placeSurface(
        context,
        {
          left: placement.rect.left - origin.left,
          top: placement.rect.top - origin.top,
          width: placement.rect.width,
          height: placement.rect.height,
          drawing: drawings[index],
        },
        scale,
        labels,
      );
    }

    return {
      image: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      surfacesAbsent: drawings.filter((drawing) => !drawing).length,
    };
  }

  private load(): Promise<Renderer> {
    this.renderer ??= import('@zumer/snapdom').then(
      (module) => module.snapdom as Renderer,
    );
    return this.renderer;
  }
}
