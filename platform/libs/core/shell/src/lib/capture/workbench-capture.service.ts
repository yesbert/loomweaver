import { DOCUMENT, inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  CapturableSurface,
  SurfaceCaptureRegistry,
} from './surface-capture-registry';
import { PictureBox, placeCover, placeSurface } from './picture-assembly';
import { PaintPlan, paintPlan } from './covering-layers';
import { scaleForSize, WorkbenchPictureSize } from './picture-size';
import {
  carriedForm,
  pictureEncoding,
  WorkbenchCarriedForm,
  WorkbenchPictureForm,
} from './picture-form';
import { decodeCapture, DrawRequest } from './ask-surface';
import { DrawingSize, drawingSize } from '../surface-kit/picture-primitives';

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
  readonly element: Element;
  readonly rect: DOMRect;
}

interface PictureParts {
  readonly origin: DOMRect;
  readonly placements: readonly Placement[];
  readonly images: readonly (CanvasImageSource | undefined)[];
  readonly plan: PaintPlan;
  readonly covers: readonly (CanvasImageSource | undefined)[];
}

interface Renderer {
  toCanvas(
    target: Element,
    options: DrawingSize,
  ): Promise<HTMLCanvasElement>;
}

/**
 * Draws the workbench as the user is seeing it, plugin surfaces included.
 *
 * The browser will not photograph the screen without a permission prompt and a surface picker, so
 * the picture is rendered from the document instead. That stops at an isolated surface, whose
 * content nothing outside it may read, so each one is asked to draw itself and its answer is placed
 * where it sits. A surface that cannot answer is drawn as a statement that its content is absent,
 * never as a blank — a blank in a picture attached to a fault report reads as evidence. What lies
 * over a surface on screen — a notification, an open menu, a dialog — lies over it in the picture.
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

    const drawRequest = { scale, ...pictureEncoding(request?.form) };
    const size = drawingSize(scale);

    const placements = this.placements();
    const plan = paintPlan(root, placements, view);
    const origin = root.getBoundingClientRect();
    const [images, canvas, covers] = await Promise.all([
      this.drawSurfaces(placements, drawRequest, view),
      renderer.toCanvas(root, size),
      this.drawCovers(renderer, plan, size),
    ]);

    return this.assemble(
      canvas,
      { origin, placements, images, plan, covers },
      drawRequest,
    );
  }

  private async drawCovers(
    renderer: Renderer,
    plan: PaintPlan,
    size: DrawingSize,
  ): Promise<(HTMLCanvasElement | undefined)[]> {
    const covers: (HTMLCanvasElement | undefined)[] = [];
    for (const pass of plan.passes) {
      covers.push(
        pass.covers.length > 0
          ? await renderer.toCanvas(pass.layer.element, size)
          : undefined,
      );
    }
    return covers;
  }

  private window(): Window {
    const view = this.document.defaultView;
    if (!view) {
      throw new Error('the workbench has no window to draw');
    }
    return view;
  }

  private placements(): readonly Placement[] {
    return this.surfaces.visible().map((surface) => ({
      surface,
      element: surface.element,
      rect: surface.element.getBoundingClientRect(),
    }));
  }

  private async drawSurfaces(
    placements: readonly Placement[],
    drawRequest: DrawRequest,
    view: Window,
  ): Promise<readonly (CanvasImageSource | undefined)[]> {
    const captures = await Promise.all(
      placements.map((placement) => placement.surface.captureSelf(drawRequest)),
    );
    return Promise.all(
      captures.map((capture) => decodeCapture(capture, view)),
    );
  }

  private assemble(
    canvas: HTMLCanvasElement,
    parts: PictureParts,
    drawRequest: DrawRequest,
  ): WorkbenchPicture {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('the workbench drawing has no surface to place onto');
    }
    const { origin, placements, images, plan, covers } = parts;
    const { scale } = drawRequest;
    const labels = { absent: this.transloco.translate('capture.surfaceAbsent') };
    const boxOf = (rect: DOMRect): PictureBox => ({
      left: rect.left - origin.left,
      top: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    });
    const stamp = (indexes: readonly number[]): void => {
      for (const index of indexes) {
        placeSurface(
          context,
          { ...boxOf(placements[index].rect), image: images[index] },
          scale,
          labels,
        );
      }
    };

    stamp(plan.beneath);
    for (const [index, pass] of plan.passes.entries()) {
      const image = covers[index];
      if (image) {
        placeCover(
          context,
          { ...boxOf(pass.layer.rect), image },
          pass.covers.map((covered) => boxOf(placements[covered].rect)),
          scale,
        );
      }
      stamp(pass.holds);
    }

    const image = canvas.toDataURL(drawRequest.mediaType, drawRequest.quality);
    return {
      image,
      width: canvas.width,
      height: canvas.height,
      form: carriedForm(image),
      surfacesAbsent: images.filter((surfaceImage) => !surfaceImage).length,
    };
  }

  private load(): Promise<Renderer> {
    this.renderer ??= import('@zumer/snapdom').then(
      (module) => module.snapdom as Renderer,
    );
    return this.renderer;
  }
}
