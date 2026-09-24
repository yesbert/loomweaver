import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { isPopoutUrl } from './popout-path';

@Service()
export class PopoutWindow {
  readonly active = isPopoutUrl(inject(DOCUMENT).location?.pathname ?? '');
}
