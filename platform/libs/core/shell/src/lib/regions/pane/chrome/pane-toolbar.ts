import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-pane-toolbar',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex items-center gap-0.5' },
  templateUrl: './pane-toolbar.html',
})
export class PaneToolbar {
  readonly canNewTab = input(false);
  readonly canSplitRight = input(false);
  readonly canSplitDown = input(false);
  readonly canMinimize = input(false);
  readonly canMaximize = input(false);
  readonly maximized = input(false);
  readonly canClose = input(false);
  readonly closeLabel = input('content.split.closePane');
  readonly newTabTestId = input('');
  readonly splitRightTestId = input('');
  readonly splitDownTestId = input('');

  readonly newTab = output<Event>();
  readonly splitRight = output<void>();
  readonly splitDown = output<void>();
  readonly minimize = output<void>();
  readonly toggleMaximize = output<void>();
  readonly closePane = output<void>();
}
