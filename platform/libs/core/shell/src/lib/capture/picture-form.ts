/** A compressed form a picture may be carried in. */
export type WorkbenchCompression = 'jpeg' | 'webp';

/**
 * The form a picture of the workbench is carried in.
 *
 * `'lossless'` is what a request that says nothing gets, because compression is unkind to the small
 * text a fault report is usually read for. A compressed form is for carrying: name how strongly with
 * `quality`, between 0 and 1, where the default is already well below what a browser would choose on
 * its own.
 */
export type WorkbenchPictureForm =
  | 'lossless'
  | { readonly compressed: WorkbenchCompression; readonly quality?: number };

/** What a picture turned out to be carried in, read back from the drawing rather than assumed. */
export type WorkbenchCarriedForm = 'lossless' | WorkbenchCompression;

export interface DrawingForm {
  readonly mediaType: string;
  readonly quality: number | undefined;
}

const LOSSLESS_MEDIA_TYPE = 'image/png';

const MEDIA_TYPES: Readonly<Record<WorkbenchCompression, string>> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const DEFAULT_QUALITY = 0.8;

const CARRIED: Readonly<Record<string, WorkbenchCarriedForm>> = {
  'image/png': 'lossless',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
};

export function drawingForm(
  form: WorkbenchPictureForm | undefined,
): DrawingForm {
  if (form === undefined || form === 'lossless') {
    return { mediaType: LOSSLESS_MEDIA_TYPE, quality: undefined };
  }
  return {
    mediaType: MEDIA_TYPES[form.compressed] ?? LOSSLESS_MEDIA_TYPE,
    quality: quality(form.quality),
  };
}

export function carriedForm(image: string): WorkbenchCarriedForm {
  const end = image.indexOf(';');
  const mediaType = end > 5 ? image.slice(5, end) : '';
  return CARRIED[mediaType] ?? 'lossless';
}

function quality(asked: number | undefined): number {
  if (asked === undefined || !Number.isFinite(asked)) {
    return DEFAULT_QUALITY;
  }
  return Math.min(1, Math.max(0, asked));
}
