import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FontScale, FontScaleService } from './font-scale.service';

@Component({
  selector: 'lw-text-size-toggle',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './text-size-toggle.html',
})
export class TextSizeToggle {
  private readonly fontScale = inject(FontScaleService);
  protected readonly scale = this.fontScale.scale;
  protected readonly scales: readonly FontScale[] = ['sm', 'md', 'lg', 'xl'];

  private readonly glyph: Record<FontScale, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  protected glyphClass(scale: FontScale): string {
    return this.glyph[scale];
  }

  protected select(scale: FontScale): void {
    this.fontScale.setScale(scale);
  }
}
