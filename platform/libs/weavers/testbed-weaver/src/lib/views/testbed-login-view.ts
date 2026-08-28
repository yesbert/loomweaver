import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { testbedAuth } from '../plugin/testbed-auth';

@Component({
  imports: [TranslocoPipe],
  selector: 'lw-testbed-login-view',
  templateUrl: './testbed-login-view.html',
})
export class TestbedLoginView {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly from = this.route.snapshot.queryParamMap.get('from') ?? '';

  protected signIn(): void {
    testbedAuth.signInAsAdmin();
    void this.router.navigateByUrl('/' + this.from);
  }
}
