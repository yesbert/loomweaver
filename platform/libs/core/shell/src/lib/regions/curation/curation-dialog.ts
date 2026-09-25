import { DialogRef } from '@loomweaver/plugin-sdk';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CurationRow, CurationSource, HIDDEN } from './curation-source';
import { RailCuration } from './rail-curation';
import { ViewCuration } from './view-curation';

export type CurationKind = 'rail' | 'views';

export interface CurationDialogData {
  readonly kind: CurationKind;
}

export const CURATION_CHROME: Record<
  CurationKind,
  { readonly title: string; readonly icon: string }
> = {
  rail: { title: 'rail.customize', icon: 'edit' },
  views: { title: 'panel.customizeViews', icon: 'navigator' },
};

interface CurationPlace {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'lw-curation-dialog',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './curation-dialog.html',
})
export class CurationDialog {
  private readonly ref = inject(DialogRef);
  private readonly transloco = inject(TranslocoService);

  protected readonly query = signal('');

  private readonly kind =
    (this.ref.data as CurationDialogData | undefined)?.kind ?? 'rail';

  private readonly source = inject<CurationSource>(
    this.kind === 'rail' ? RailCuration : ViewCuration,
  );

  protected readonly chrome = CURATION_CHROME[this.kind];

  protected readonly places = computed<CurationPlace[]>(() => {
    const regions = this.source.regions();
    const hidden = {
      id: HIDDEN,
      label: this.transloco.translate('curation.hidden'),
    };
    if (regions.length < 2) {
      return [
        hidden,
        {
          id: regions[0]?.id ?? HIDDEN,
          label: this.transloco.translate('curation.shown'),
        },
      ];
    }
    return [
      hidden,
      ...regions.map((region) => ({
        id: region.id,
        label: this.transloco.translate(
          region.dock === 'right' ? 'curation.right' : 'curation.left',
        ),
      })),
    ];
  });

  protected readonly rows = computed<CurationRow[]>(() => {
    const all = this.source.rows();
    const query = this.query().trim().toLowerCase();
    return query
      ? all.filter((row) => row.label.toLowerCase().includes(query))
      : all;
  });

  protected place(row: CurationRow, place: string): void {
    if (place !== row.place) {
      this.source.place(row, place);
    }
  }
}
