import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'demo-legal-link',
  imports: [TranslocoPipe],
  templateUrl: './legal-link.html',
})
export class LegalLink {}
