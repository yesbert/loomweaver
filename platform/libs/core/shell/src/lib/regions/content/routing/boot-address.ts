import { Location } from '@angular/common';
import { inject, Service } from '@angular/core';

@Service()
export class BootAddress {
  readonly path = inject(Location).path();
}
