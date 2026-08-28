import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthContext } from '@loomweaver/shell';
import { demoSession } from './session';

@Component({
  selector: 'demo-account-status',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './account-status.html',
})
export class AccountStatus {
  protected readonly auth = inject(AuthContext);
  protected readonly name = computed(
    () => demoSession.account().displayName ?? '',
  );

  protected signIn(): void {
    demoSession.signIn();
  }
}
