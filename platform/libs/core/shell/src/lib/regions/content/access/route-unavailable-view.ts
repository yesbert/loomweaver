import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FailedPluginContent } from '../../../plugin/failed-plugin-content';

@Component({
  selector: 'lw-route-unavailable',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './route-unavailable-view.html',
})
export class RouteUnavailableView {
  readonly path = input('');

  private readonly failedContent = inject(FailedPluginContent);

  protected readonly recovery = computed(() =>
    this.failedContent.recoveryFor(this.path()),
  );

  protected readonly messageKey = computed(() =>
    this.failedContent.holds(this.path())
      ? 'route.pluginFailedMessage'
      : 'route.unavailableMessage',
  );
}
