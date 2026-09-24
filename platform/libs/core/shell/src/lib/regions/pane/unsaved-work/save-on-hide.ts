import { inject, Service } from '@angular/core';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { NotificationService } from '../../../notifications/notification.service';
import { saveOnHidePath } from '../retention/retention-policy';
import { dirtySurfaceOf } from './dirty-surface';

@Service()
export class SaveOnHide {
  private readonly notifications = inject(NotificationService);
  private saved = new Set<unknown>();

  forgetAllBut(parked: ReadonlySet<unknown>): void {
    this.saved = new Set(
      [...this.saved].filter((instance) => parked.has(instance)),
    );
  }

  saveOnce(
    instance: unknown,
    path: string,
    routes: readonly ContentRoute[],
    views: readonly View[],
  ): void {
    if (this.saved.has(instance) || !saveOnHidePath(routes, views, path)) {
      return;
    }
    const save = dirtySurfaceOf(instance)?.surfaceSave;
    if (!save) {
      return;
    }
    this.saved.add(instance);
    save.call(instance).catch((error: unknown) => {
      console.error('saveOn:hide failed — the surface stays dirty', error);
      this.notifications.show({
        message: 'retention.saveFailed',
        kind: 'warning',
      });
    });
  }
}
