import { Component, input } from '@angular/core';

/**
 * One settings row: label (+ optional description) on the left, the control projected on
 * the right. A pure layout primitive — the host slots the matching control
 * (`<lw-select>`, later toggle/button) via content projection.
 */
@Component({
  selector: 'lw-setting-row',
  templateUrl: './lw-setting-row.html',
})
export class LwSettingRow {
  readonly label = input('');
  readonly description = input('');
}
