import { DOCUMENT, inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  CapturableSurface,
  SurfaceCaptureRegistry,
} from './surface-capture-registry';
import { placeSurface } from './picture-assembly';
import { scaleForSize, WorkbenchPictureSize } from './picture-size';
import {
  carriedForm,
  drawingForm,
  WorkbenchCarriedForm,
  WorkbenchPictureForm,
} from './picture-form';
import { SurfaceDrawing } from './surface-capture';
import { decodeDrawing } from './decode-drawing';

/** What a caller may ask for about the picture before it is drawn. */
export interface WorkbenchPictureRequest {
  /** How large to draw it. The density of the screen when absent. */
  readonly size?: WorkbenchPictureSize;
  /** What form to carry it in. Losslessly when absent. */
  readonly form?: WorkbenchPictureForm;
}

/** A drawing of the workbench, made without asking the browser for permission. */
export interface WorkbenchPicture {
  /** The drawing, as a `data:` URL, ready to show, annotate or attach to a report. */
  readonly image: string;
  readonly width: number;
  readonly height: number;
  /**
   * The form the picture is carried in, read back from the drawing rather than taken from the
   * request: a browser that cannot produce the form asked for substitutes one silently.
   */
  readonly form: WorkbenchCarriedForm;
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

  async capture(request?: WorkbenchPictureRequest): Promise<WorkbenchPicture> {
    const view = this.window();
    const renderer = await this.load();
    const root = this.document.body;
    const scale = scaleForSize(
      request?.size,
      view.devicePixelRatio,
      root.getBoundingClientRect().width,
    );

    const drawing = { scale, ...drawingForm(request?.form) };

    const placements = this.placements();
    const [drawings, canvas] = await Promise.all([
      this.drawSurfaces(placements, drawing, view),
      renderer.toCanvas(root, { scale }),
    ]);

    return this.assemble(canvas, root, placements, drawings, drawing);
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
    drawing: SurfaceDrawing,
    view: Window,
  ): Promise<readonly (CanvasImageSource | undefined)[]> {
    const answered = await Promise.all(
      placements.map((placement) => placement.surface.captureSelf(drawing)),
    );
    return Promise.all(answered.map((drawing) => decodeDrawing(drawing, view)));
  }

  private assemble(
    canvas: HTMLCanvasElement,
    root: Element,
    placements: readonly Placement[],
    drawings: readonly (CanvasImageSource | undefined)[],
    drawing: SurfaceDrawing,
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
        drawing.scale,
        labels,
      );
    }

    const image = canvas.toDataURL(drawing.mediaType, drawing.quality);
    return {
      image,
      width: canvas.width,
      height: canvas.height,
      form: carriedForm(image),
      surfacesAbsent: drawings.filter((answer) => !answer).length,
    };
  }

  private load(): Promise<Renderer> {
    this.renderer ??= import('@zumer/snapdom').then(
      (module) => module.snapdom as Renderer,
    );
    return this.renderer;
  }
}
