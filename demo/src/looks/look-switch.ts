import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { activeLook, switchLook } from './look-choice';
import { LOOKS } from './looks';

@Component({
  selector: 'demo-look-switch',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './look-switch.html',
})
export class LookSwitch {
  protected readonly looks = LOOKS;
  protected readonly active = activeLook;

  protected onChange(event: Event): void {
    const value = (event as CustomEvent<{ value: string }>).detail?.value;
    if (value) {
      switchLook(value);
    }
  }
}
