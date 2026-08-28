import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthContext } from '../../../auth/auth-context';

@Component({
  selector: 'lw-auth-required',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './auth-required-view.html',
})
export class AuthRequiredView {
  private readonly auth = inject(AuthContext);

  protected readonly titleKey = computed(() =>
    this.auth.authenticated() ? 'auth.deniedTitle' : 'auth.requiredTitle',
  );

  protected readonly messageKey = computed(() =>
    this.auth.authenticated() ? 'auth.deniedMessage' : 'auth.requiredMessage',
  );
}
