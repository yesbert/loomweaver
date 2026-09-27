import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { ServedBase } from '../foundation/served-base';
import { isPopoutUrl } from './popout-path';

@Service()
export class PopoutWindow {
  readonly active = isPopoutUrl(
    inject(ServedBase).below(inject(DOCUMENT).location?.pathname ?? ''),
  );
}
